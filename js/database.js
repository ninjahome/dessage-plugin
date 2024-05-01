let __databaseObj;
const request = indexedDB.open('dessage-database', 1);

request.onerror = function (event) {
    console.log("data base open failed:",event);
};

request.onsuccess = function (event) {
    __databaseObj = event.target.result;
    console.log("data base open success:",event);
};

const __constWalletTable = 'dessage-wallet';
request.onupgradeneeded = function (event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(__constWalletTable)) {
        const objectStore = db.createObjectStore(__constWalletTable, {keyPath: 'id'});
        objectStore.createIndex('name', 'name', { unique: false });
        console.log("create wallet table success")
    }
};

function closeDatabase() {
    if (__databaseObj) {
        __databaseObj.close();
        console.log("Database connection closed.");
    }
}