class SysSetting {

    constructor(id, addr, network) {
        this.id = id;
        this.address = addr;
        this.network = network;
    }

    async  syncToDB(){
        await databaseUpdate(__tableSystemSetting,this.id, this);
    }
}

let __systemSetting = null;

async function loadLastSystemSetting() {
    const ss = await getMaxIdRecord(__tableSystemSetting)
    if (ss){
        __systemSetting = new SysSetting(ss.id, ss.address, ss.network);
        return;
    }
    __systemSetting = new SysSetting(__currentDatabaseVersion,'','');
}

