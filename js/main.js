document.addEventListener("DOMContentLoaded", initDessagePlugin);

async function initDessagePlugin() {
    await initDatabase();

    createPrivateKey();
}