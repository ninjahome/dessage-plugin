(function () {
    window.addEventListener("message", (event) => {
        if (event.source !== window || !event.data || event.data.source !== "dessage-response") {
            return;
        }

        const {id, result, error} = event.data;
        if (id && __injectRequests[id]) {
            const {resolve, reject} = __injectRequests[id];
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
            delete __injectRequests[id];
        }

        console.log("Response from background:", result);
    });

    // 通用的 __injectCall 函数
    const __injectRequests = {};

    function __injectCall(type, params) {
        const id = Math.random().toString().slice(-4);
        return new Promise((resolve, reject) => {
            __injectRequests[id] = {resolve, reject};
            window.postMessage(
                {
                    id,
                    ext: 'nos2x',
                    type,
                    params
                },
                '*'
            );

            // Optionally handle timeout
            setTimeout(() => {
                if (__injectRequests[id]) {
                    reject(new Error('Request timed out'));
                    delete __injectRequests[id];
                }
            }, 10000); // 10秒超时
        });
    }

    // 设置 dessage 对象
    window.dessage = {
        version: '1.0.0',
        connect: function () {
            console.log('Connecting to Dessage...');
            window.postMessage({source: "dessage", action: "someAction", data: "some data"}, "*");
        },
    };

    window.nostr = {
        _pubkey: null,

        async getPublicKey() {
            if (this._pubkey) return this._pubkey;
            this._pubkey = await __injectCall('getPublicKey', {});
            return this._pubkey;
        },

        async signEvent(event) {
            return __injectCall('signEvent', {event});
        },

        async getRelays() {
            return __injectCall('getRelays', {});
        },

        nip04: {
            async encrypt(peer, plaintext) {
                return __injectCall('nip04.encrypt', {peer, plaintext});
            },

            async decrypt(peer, ciphertext) {
                return __injectCall('nip04.decrypt', {peer, ciphertext});
            }
        },

        nip44: {
            async encrypt(peer, plaintext) {
                return __injectCall('nip44.encrypt', {peer, plaintext});
            },

            async decrypt(peer, ciphertext) {
                return __injectCall('nip44.decrypt', {peer, ciphertext});
            }
        }
    };
    console.log(`Dessage client initialized for domain:[${window.location.host}]`);
})();
