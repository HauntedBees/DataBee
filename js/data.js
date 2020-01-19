class DataObj {
    constructor(name, type) {
        this.name = name;
        this.type = type;
        this.data = [];
        this.tags = {};
        this.sortType = "manual";
        this.sortDir = 1;
        this.filterChecks = true;
        this.date = +new Date();
    }
}
class Checklist extends DataObj {
    constructor(name) { super(name, "checklist"); }
}
class NoteList extends DataObj {
    constructor(name) {
        super(name, "notes");
        this.displayType = "tiles";
    }
}
class ChecklistItem {
    constructor(val) {
        this.val = val;
        this.checked = false;
        this.important = false;
        this.tags = [];
        this.notes = "";
        this.date = +new Date();
    }
}
class NoteListItem {
    constructor(title, body) {
        this.title = title;
        this.body = body;
        this.val = title + body;
        this.tags = [];
        this.important = false;
        this.date = +new Date();
    }
}
class Tag {
    constructor(tag, color, imgVal, id) {
        this.id = id || data.GetGUID();
        this.tag = tag;
        this.color = color;
        this.imgVal = imgVal;
        this.sortOrder = 0;
    }
}
let dbData = {
    _id: "databee",
    dbList: [],
    currentScreen: -1,
    settings: {
        theme: 0, 
        leftHanded: false
    }
};
const data = {
    IsManualSorting: function(dataIdx) { return dbData.dbList[dataIdx || dbData.currentScreen].sortType === "manual"; },
    AddressVersionChanges: function() {
        let hasChanges = false;
        if(dbData.leftHanded !== undefined) {               // 0JAN03 to 0JAN04
            dbData.settings.leftHanded = dbData.leftHanded;
            delete dbData.leftHanded;
            hasChanges = true;
        }
        for(let i = 0; i < dbData.dbList.length; i++) {
            const dObj = dbData.dbList[i];
            if(dObj.sortType === undefined) {               // 0JAN03 to 0JAN04
                dObj.sortType = 0;
                dObj.filterChecks = true;
                hasChanges = true;
            } else if(typeof dObj.sortType === "number") {  // 0JAN05 to 0JAN12
                dObj.sortType = "manual";
                dObj.sortDir = 1;
                hasChanges = true;
            }
            if(dObj.tags === undefined) {                   // 0JAN04 to 0JAN05
                dObj.tags = {};
                hasChanges = true;
            }
            const dTags = Object.keys(dObj.tags).map(key => dObj.tags[key]);
            for(let j = 0; j < dTags.length; j++) {
                const dTag = dTags[j];
                if(dTag.imgVal === undefined) {             // 0JAN18 to 0JAN19
                    dTag.imgVal = "";
                    dTag.sortOrder = j;
                    hasChanges = true;
                }
                if(typeof dTag.color === "string") {   // 0JAN18 to 0JAN19
                    dTag.color = parseInt(dTag.color.replace("tagColor", ""));
                    hasChanges = true;
                }
            }
            const dData = dObj.data;
            for(let j = 0; j < dData.length; j++) {
                const dItem = dData[j];
                if(dItem.tags === undefined) {              // 0JAN04 to 0JAN05
                    dItem.tags = [];
                    hasChanges = true;
                }
                if(dItem.date === undefined) {              // 0JAN05 to 0JAN12
                    dItem.date = +new Date();
                    hasChanges = true;
                }
                if(dItem.notes === undefined) {             // 0JAN13 to 0JAN17
                    dItem.notes = "";
                    hasChanges = true;
                }
            }
        }
        if(hasChanges) {
            console.log("UPDATING!");
            data.Save();
        }
    },
    SaveTag: function(dataIdx, tag, dontSave) {
        const clist = dbData.dbList[dataIdx];
        clist.tags[tag.id] = tag;
        if(dontSave !== true) { data.Save(); }
    },
    DeleteTag: function(dataIdx, tagId, dontSave) {
        const clist = dbData.dbList[dataIdx];
        delete clist.tags[tagId];
        if(dontSave !== true) { data.Save(); }
    },
    ReorderTags: function(dataIdx, tagId, oldPos, newPos, dontSave) {
        if(oldPos === newPos) { return; }
        const clist = dbData.dbList[dataIdx];
        const dir = (newPos > oldPos) ? 1 : -1;
        for(const id in clist.tags) { // TWEAK SLIGHTLY PROBABLY
            const e = clist.tags[id];
            if(id === tagId) {
                e.sortOrder = newPos;
            } else if(dir > 0 && e.sortOrder < newPos && e.sortOrder > oldPos) {
                e.sortOrder -= 1;
            } else if(dir < 0 && e.sortOrder > newPos && e.sortOrder < oldPos) {
                e.sortOrder += 1;
            }
        }
        if(dontSave !== true) { data.Save(); }
    },
    SaveNewTags: function(dataIdx, tags, toDelete, dontSave) { // TODO: probably delete
        const clist = dbData.dbList[dataIdx];
        clist.tags = tags;
        for(let i = 0; i < toDelete.length; i++) {
            const deleteId = toDelete[i];
            for(let j = 0; j < clist.data.length; j++) {
                const obj = clist.data[j];
                obj.tags = obj.tags.filter(e => e !== deleteId);
            }
        }
        if(dontSave !== true) { data.Save(); }
    },
    ToggleTag: function(dataIdx, elemIdx, tagId, dontSave) {
        const clist = dbData.dbList[dataIdx];
        const elem = clist.data[elemIdx];
        const tagIdx = elem.tags.indexOf(tagId);
        if(tagIdx < 0) {
            elem.tags.push(tagId);
        } else {
            elem.tags.splice(tagIdx, 1);
        }
        if(dontSave !== true) { data.Save(); }
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
        dbData.currentScreen = dataIdx - 1;
        if(dbData.currentScreen < 0 && dbData.dbList.length > 0) { dbData.currentScreen = 0; }
        if(dontSave !== true) { data.Save(DrawSidebar); }
    },
    SwapDatas: function(oldIdx, newIdx, dontSave) {
        const currentName = dbData.dbList[dbData.currentScreen].name;
        const elem = dbData.dbList[oldIdx];
        dbData.dbList.splice(oldIdx, 1);
        dbData.dbList.splice(newIdx, 0, elem);
        for(let i = 0; i < dbData.dbList.length; i++) {
            const elem = dbData.dbList[i];
            if(elem.name === currentName) {
                dbData.currentScreen = i;
                break;
            }
        }
        if(dontSave !== true) { data.Save(); }
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
        const dataList = dbData.dbList[dataIdx];
        const sortType = dataList.sortType;
        const sortDir = dataList.sortDir;
        const doFilter = dataList.filterChecks || false;
        const dataItems = dataList.data;
        switch(sortType) {
            case "manual":
                dataItems.sort((a, b) => {
                    if(doFilter) {
                        if(a.checked && !b.checked) { return 1; }
                        if(!a.checked && b.checked) { return -1; }
                    }
                    return 0;
                });
                break;
            case "alphabetical": 
                dataItems.sort((a, b) => {
                    if(doFilter) {
                        if(a.checked && !b.checked) { return 1; }
                        if(!a.checked && b.checked) { return -1; }
                    }
                    const aL = a.val.toLowerCase(), bL = b.val.toLowerCase();
                    if(aL < bL) { return -sortDir; }
                    if(aL > bL) { return sortDir; }
                    return 0;
                });
                break;
            case "importance": 
                dataItems.sort((a, b) => {
                    if(doFilter) {
                        if(a.checked && !b.checked) { return 1; }
                        else if(!a.checked && b.checked) { return -1; }
                    }
                    if(a.important && !b.important) { return -sortDir; }
                    else if(!a.important && b.important) { return sortDir; }
                    const aL = a.val.toLowerCase(), bL = b.val.toLowerCase();
                    if(aL < bL) { return -sortDir; }
                    if(aL > bL) { return sortDir; }
                    return 0;
                });
                break;
            case "date": 
                dataItems.sort((a, b) => {
                    if(doFilter) {
                        if(a.checked && !b.checked) { return 1; }
                        else if(!a.checked && b.checked) { return -1; }
                    }
                    if(a.date > b.date) { return -sortDir; }
                    else if(a.date < b.date) { return sortDir; }
                    const aL = a.val.toLowerCase(), bL = b.val.toLowerCase();
                    if(aL < bL) { return -sortDir; }
                    if(aL > bL) { return sortDir; }
                    return 0;
                });
                break;
            case "tag":
                const allTags = dbData.dbList[dataIdx].tags;
                dataItems.sort((a, b) => {
                    if(doFilter) {
                        if(a.checked && !b.checked) { return 1; }
                        else if(!a.checked && b.checked) { return -1; }
                    }
                    const atags = a.tags.map(tagId => allTags[tagId].tag).join("") || "zzzzz";
                    const btags = b.tags.map(tagId => allTags[tagId].tag).join("") || "zzzzz";
                    if(atags < btags) { return -sortDir; }
                    if(atags > btags) { return sortDir; }
                    const aL = a.val.toLowerCase(), bL = b.val.toLowerCase();
                    if(aL < bL) { return -sortDir; }
                    if(aL > bL) { return sortDir; }
                    return 0;
                });
                break;
        }
    },
    MoveDataItem: function(oldDataIdx, newDataIdx, elemIdx, dontSave) {
        const elem = dbData.dbList[oldDataIdx].data.splice(elemIdx, 1)[0];
        // TODO: handle tag changes
        data.AddDataItem(newDataIdx, elem, dontSave);
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
    UpdateChecklistItem: function(dataIdx, elemIdx, name, checked, notes, dontSave) {
        const list = dbData.dbList[dataIdx].data;
        if(elemIdx < 0 || elemIdx >= list.length) { return; }
        const elem = list[elemIdx];
        elem.date = +new Date();
        if(name !== undefined) { elem.val = name; }
        if(checked !== undefined) { elem.checked = checked; }
        if(notes !== undefined) { elem.notes = notes; }
        data.SortDataItems(dataIdx);
        if(dontSave !== true) { data.Save(); }
    },   
    UpdateNoteListItem: function(dataIdx, elemIdx, title, body, dontSave) {
        const list = dbData.dbList[dataIdx].data;
        if(elemIdx < 0 || elemIdx >= list.length) { return; }
        const elem = list[elemIdx];
        elem.date = +new Date();
        if(title !== undefined) { elem.title = title; }
        if(body !== undefined) { elem.body = body; }
        elem.val = elem.title + elem.body;
        data.SortDataItems(dataIdx);
        if(dontSave !== true) { data.Save(); }
    },
    ClearCompletedChecklistItems: function(dataIdx, dontSave) {
        const list = dbData.dbList[dataIdx].data;
        dbData.dbList[dataIdx].data = list.filter(e => e.checked === false);
        if(dontSave !== true) { data.Save(); }
    },
    SearchDataItems: function(query) {
        const results = [];
        dbData.dbList.forEach((arr, arrIdx) => {
            arr.data.forEach((elem, elemIdx) => {
                if(elem.val.toLowerCase().indexOf(query) >= 0) {
                    elem.ownerName = arr.name;
                    elem.ownerIdx = arrIdx;
                    elem.myIdx = elemIdx;
                    elem.listType = arr.type;
                    results.push(elem);
                }
            });
        });
        return results;
    },
    GetChecklistItemNotes: function(dataIdx, elemIdx) {
        const list = dbData.dbList[dataIdx].data;
        if(elemIdx < 0 || elemIdx >= list.length) { return; }
        const elem = list[elemIdx];
        return elem.notes;
    },
    Load: function(callback) {
        db.get("databee").then(function(doc) {
            dbData = Object.assign(dbData, doc);
            data.AddressVersionChanges();
            if(callback !== undefined) { callback(); }
        }).catch(function(e) {
            console.log(e);
            data.dbList = [];
            db.put(dbData).then(function(res) {
                dbData._rev = res.rev;
                if(callback !== undefined) { callback(); }
            }).catch(function(err) {
                ShowAlert("Loading Error", JSON.stringify(err));
            });
        });
    },
    Save: function(callback) {
        $("#savingIcon").show();
        db.put(dbData).then(function(res) {
            dbData._rev = res.rev;
            $("#savingIcon").hide();
            if(callback !== undefined) { callback(); }
        }).catch(function(err) {
            $("#savingIcon").hide();
            ShowAlert("Saving Error", JSON.stringify(err));
        });
    },
    ImportChooser: function(file) {
        const dObj = file.dataURI;
        const prefix = "data:application/octet-stream;base64,";
        if(dObj.indexOf(prefix) !== 0) {
            ShowAlert("Import Failed", "Invalid databee format.");
            return;
        }
        const decodedData = window.atob(dObj.replace(prefix, ""));
        data.ProcessJSON(decodedData);
    },
    Import: function(files) {
        const reader = new FileReader();
        reader.onload = function(e) { data.ProcessJSON(e.target.result); };
        reader.onerror = function() { ShowAlert("Import Failed", "Reading file as text was unsuccessful."); };
        reader.readAsText(files[0]);
    },
    ProcessJSON: function(str) {
        if(str.indexOf("databee") < 0) {
            ShowAlert("Import Failed", "Invalid databee format.");
            return;
        }
        try {
            const oldRev = dbData._rev;
            dbData = JSON.parse(str);
            dbData._rev = oldRev;
            data.Save(function() {
                ShowAlert("Import Succeeded!", "Your database is now up-to-date!");
                DrawSidebar();
            });
        } catch {
            ShowAlert("Import Failed", "Invalid databee json format.");
        }
    },
    GetGUID: function() {
        let dt = new Date().getTime();
        const guid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            const r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return guid;
    }
};