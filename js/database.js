let __databaseObj;
const __currentDatabaseVersion = 2;
const __tableNameWallet = '__table_wallet__';

function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('dessage-database', __currentDatabaseVersion);

        request.onerror = function (event) {
            console.error("Database open failed:", event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = function (event) {
            __databaseObj = event.target.result;
            console.log("Database open success, version=", __databaseObj.version);
            resolve(__databaseObj);
        };

        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(__tableNameWallet)) {
                const objectStore = db.createObjectStore(__tableNameWallet, {keyPath: 'address'});
                objectStore.createIndex('addressIdx', 'address', {unique: true});
                objectStore.createIndex('uuidIdx', 'uuid', {unique: true});
                console.log("Created cached item table successfully.");
            }
        };
    });
}

function closeDatabase() {
    if (__databaseObj) {
        __databaseObj.close();
        console.log("Database connection closed.");
    }
}

function databaseAddItem(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = __databaseObj.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.add(data);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = event => {
            reject(`Error adding data to ${storeName}: ${event.target.error}`);
        };
    });
}

function databaseGetByIndex(storeName, idx, idxVal) {
    return new Promise((resolve, reject) => {
        try {
            const transaction = __databaseObj.transaction([storeName], 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const index = objectStore.index(idx);

            const queryRequest = index.get(idxVal);

            queryRequest.onsuccess = function () {
                if (queryRequest.result) {
                    resolve(queryRequest.result);
                } else {
                    resolve(null);
                }
            };

            queryRequest.onerror = function (event) {
                reject('Error in query by key: ' + event.target.error);
            };
        } catch (error) {
            reject('Transaction failed: ' + error.message);
        }
    });
}

function databaseGetByID(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = __databaseObj.transaction([storeName], 'readonly');
        const objectStore = transaction.objectStore(storeName);

        const request = objectStore.get(id);

        request.onsuccess = event => {
            const result = event.target.result;
            if (result) {
                resolve(result);
            } else {
                resolve(null);
            }
        };

        request.onerror = event => {
            reject(`Error getting data from ${storeName}: ${event.target.error}`);
        };
    });
}

function databaseUpdate(storeName, id, newData) {
    return new Promise((resolve, reject) => {
        const transaction = __databaseObj.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);

        const request = objectStore.put({...newData, id});

        request.onsuccess = () => {
            resolve(`Data updated in ${storeName} successfully`);
        };

        request.onerror = event => {
            reject(`Error updating data in ${storeName}: ${event.target.error}`);
        };
    });
}

function databaseAddOrUpdate(storeName, data) {
    const transaction = __databaseObj.transaction([storeName], 'readwrite');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.put(data);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            const isNewData = request.source === null;
            resolve({isNewData, id: request.result});
        };

        request.onerror = event => {
            reject(`Error adding/updating data in ${storeName}: ${event.target.error}`);
        };
    });
}

function databaseDelete(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = __databaseObj.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.delete(id);

        request.onsuccess = () => {
            resolve(`Data deleted from ${storeName} successfully`);
        };

        request.onerror = event => {
            reject(`Error deleting data from ${storeName}: ${event.target.error}`);
        };
    });
}

function databaseDeleteByFilter(storeName, conditionFn) {
    return new Promise((resolve, reject) => {
        const transaction = __databaseObj.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.openCursor();

        request.onsuccess = event => {
            const cursor = event.target.result;
            if (cursor) {
                if (conditionFn(cursor.value)) {
                    cursor.delete();
                }
                cursor.continue();
            } else {
                resolve(`Data deleted from ${storeName} successfully`);
            }
        };

        request.onerror = event => {
            reject(`Error deleting data with condition from ${storeName}: ${event.target.error}`);
        };
    });
}

function databaseQueryAll(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = __databaseObj.transaction([storeName], 'readonly');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.getAll();

        request.onsuccess = event => {
            const data = event.target.result;
            resolve(data);
        };

        request.onerror = event => {
            reject(`Error getting all data from ${storeName}: ${event.target.error}`);
        };
    });
}

function databaseQueryByFilter(storeName, conditionFn) {
    return new Promise((resolve, reject) => {
        const transaction = __databaseObj.transaction([storeName], 'readonly');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.openCursor();
        const results = [];

        request.onsuccess = event => {
            const cursor = event.target.result;
            if (cursor) {
                const data = cursor.value;
                if (conditionFn(data)) {
                    results.push(data);
                }
                cursor.continue();
            } else {
                resolve(results);
            }
        };

        request.onerror = event => {
            reject(`Error querying data from ${storeName}: ${event.target.error}`);
        };
    });
}

function databaseCleanByFilter(storeName, newData, conditionFn) {
    const clearAndFillTransaction = __databaseObj.transaction([storeName], 'readwrite');
    const objectStore = clearAndFillTransaction.objectStore(storeName);
    const clearRequest = objectStore.openCursor();

    clearRequest.onsuccess = event => {
        const cursor = event.target.result;
        if (cursor) {
            const data = cursor.value;
            if (conditionFn(data)) {
                cursor.delete();
            }
            cursor.continue();
        } else {
            const fillTransaction = __databaseObj.transaction([storeName], 'readwrite');
            const fillObjectStore = fillTransaction.objectStore(storeName);

            if (Array.isArray(newData) && newData.length > 0) {
                newData.forEach(data => {
                    if (!data.id) {
                        fillObjectStore.add(data);
                    } else {
                        fillObjectStore.put(data);
                    }
                });
            }

            fillTransaction.oncomplete = () => {
                console.log(`Table ${storeName} cleared and filled with new data.`);
            };

            fillTransaction.onerror = event => {
                console.error(`Error filling table ${storeName}: ${event.target.error}`);
            };
        }
    };

    clearRequest.onerror = event => {
        console.error(`Error clearing table ${storeName}: ${event.target.error}`);
    };
}

function databaseDeleteTable(tableName) {
    if (__databaseObj.objectStoreNames.contains(tableName)) {
        __databaseObj.deleteObjectStore(tableName);
        console.log("Object store " + tableName + " deleted");
    }
}