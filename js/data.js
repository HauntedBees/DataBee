class DataObj {
    constructor(name, type) {
        this.name = name;
        this.type = type;
        this.data = [];
        this.sortType = 0;
        this.filterChecks = 0;
    }
}
class Checklist extends DataObj {
    constructor(name) { super(name, "checklist"); }
}
class ChecklistItem {
    constructor(val) {
        this.val = val;
        this.checked = false;
        this.important = false;
    }
}
let dbData = {
    _id: "databee",
    dbList: [],
    currentScreen: -1,
    settings: {
        theme: 0, 
        leftHanded: false, 
        moveDownOnCheck: true,
        moveUpOnUncheck: true
    }
};
const data = {
    IsManualSorting: function(dataIdx) { return dbData.dbList[dataIdx || dbData.currentScreen].sortType === 0; },
    AddressVersionChanges: function() {
        let hasChanges = false;
        if(dbData.leftHanded !== undefined) {           // 0JAN03 to 0JAN04
            dbData.settings.leftHanded = dbData.leftHanded;
            delete dbData.leftHanded;
            hasChanges = true;
        }
        for(let i = 0; i < dbData.dbList.length; i++) { // 0JAN03 to 0JAN04
            const dObj = dbData.dbList[i];
            if(dObj.sortType === undefined) {
                dObj.sortType = 0;
                dObj.filterChecks = true;
                hasChanges = true;
            }
        }
        if(hasChanges) {
            console.log("UPDATING!");
            data.Save();
        }
    },
    ChangeSetting: function(key, val, dontSave) {
        dbData.settings[key] = val;
        if(key === "leftHanded") {
            if(val) { $("body").addClass("lefty"); }
            else { $("body").removeClass("lefty"); }
        }
        if(dontSave !== true) { data.Save(); }
    },
    AddData: function(elem, dontSave) {
        dbData.dbList.push(elem);
        if(dontSave !== true) { data.Save(DrawSidebar); }
    },
    RenameData: function(dataIdx, newName, dontSave) {
        dbData.dbList[dataIdx].name = newName;
        if(dontSave !== true) { data.Save(DrawSidebar); }
    },
    DeleteData: function(dataIdx, dontSave) {
        dbData.dbList.splice(dataIdx, 1);
        dbData.currentScreen = -1;
        if(dontSave !== true) { data.Save(DrawSidebar); }
    },
    AddDataItem: function(dataIdx, elem, dontSave) {
        dbData.dbList[dataIdx].data.push(elem);
        data.SortDataItems(dataIdx);
        if(dontSave !== true) { data.Save(); }
    },
    DeleteDataItem: function(dataIdx, elemIdx, dontSave) {
        dbData.dbList[dataIdx].data.splice(elemIdx, 1);
        if(dontSave !== true) { data.Save(); }
    },
    SwapDataItems: function(dataIdx, oldElemIdx, newElemIdx, dontSave) {
        const list = dbData.dbList[dataIdx].data;
        const elem = list[oldElemIdx];
        list.splice(oldElemIdx, 1);
        list.splice(newElemIdx, 0, elem);
        if(dontSave !== true) { data.Save(); }
    },
    SortDataItems: function(dataIdx) {
        const sortType = dbData.dbList[dataIdx].sortType;
        if(sortType === 0) { return; } // manual
        const doFilter = dbData.dbList[dataIdx].filterChecks;
        const list = dbData.dbList[dataIdx].data;
        switch(sortType) {
            case 1: // alphabetical
                list.sort((a, b) => {
                    if(doFilter) {
                        if(a.checked && !b.checked) { return 1; }
                        if(!a.checked && b.checked) { return -1; }
                    }
                    const aL = a.val.toLowerCase(), bL = b.val.toLowerCase();
                    if(aL < bL) { return -1; }
                    if(aL > bL) { return 1; }
                    return 0;
                });
                break;
            case 2: // importance
                list.sort((a, b) => {
                    if(doFilter) {
                        if(a.checked && !b.checked) { return 1; }
                        else if(!a.checked && b.checked) { return -1; }
                    }
                    if(a.important && !b.important) { return -1; }
                    else if(!a.important && b.important) { return 1; }
                    const aL = a.val.toLowerCase(), bL = b.val.toLowerCase();
                    if(aL < bL) { return -1; }
                    if(aL > bL) { return 1; }
                    return 0;
                });
                break;
        }
        DrawMain();
    },
    ToggleDataItemImportance: function(dataIdx, elemIdx, dontSave) {
        const list = dbData.dbList[dataIdx].data;
        if(elemIdx < 0 || elemIdx >= list.length) { return; }
        const me = list[elemIdx];
        const oldVal = me.important;
        me.important = !oldVal;
        data.SortDataItems(dataIdx);
        if(dontSave !== true) { data.Save(); }
        return me.important;
    },
    UpdateDataItem: function(dataIdx, elemIdx, name, checked, dontSave) {
        const list = dbData.dbList[dataIdx].data;
        if(elemIdx < 0 || elemIdx >= list.length) { return; }
        const me = list[elemIdx];
        if(name !== undefined) { me.val = name; }
        if(checked !== undefined) {
            me.checked = checked;
            if(checked && dbData.settings.moveDownOnCheck) {
                list.splice(elemIdx, 1);
                list.push(me);
            } else if(!checked && dbData.settings.moveUpOnUncheck) {
                list.splice(elemIdx, 1);
                let newIdx = 0;
                for(let i = 0; i < list.length; i++) {
                    const elem = list[i];
                    newIdx = i;
                    if(elem.checked) { break; }
                }
                list.splice(newIdx, 0, me);
            }
        }
        data.SortDataItems(dataIdx);
        if(dontSave !== true) { data.Save(); }
    },
    ClearCompletedDataItems: function(dataIdx, dontSave) {
        const list = dbData.dbList[dataIdx].data;
        dbData.dbList[dataIdx].data = list.filter(e => e.checked === false);
        if(dontSave !== true) { data.Save(); }
    },
    Load: function(callback) {
        db.get("databee").then(function(doc) {
            dbData = Object.assign(dbData, doc);
            data.AddressVersionChanges();
            if(callback !== undefined) { callback(); }
        }).catch(function() {
            data.dbList = [];
            db.put(dbData).then(function(res) {
                dbData._rev = res.rev;
                if(callback !== undefined) { callback(); }
            }).catch(function(err) {
                alert(JSON.stringify(err));
            });
        });
    },
    Save: function(callback) {
        db.put(dbData).then(function(res) {
            dbData._rev = res.rev;
            if(callback !== undefined) { callback(); }
        }).catch(function(err) {
            alert(JSON.stringify(err));
        });
    }
};