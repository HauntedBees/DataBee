class DataObj {
    constructor(name, type) {
        this.listVersion = 2;
        this.name = name;
        this.type = type;
        this.data = [];
        this.tags = {};
        this.tagFilters = [];
        this.tagFilterAnd = false;
        this.sortType = "manual";
        this.sortDir = 1;
        this.date = +new Date();
        this.carousel = true;
    }
}
class Checklist extends DataObj {
    constructor(name) {
        super(name, "checklist");
        this.filterChecks = true;
        this.advancedView = false;
    }
}
class NoteList extends DataObj {
    constructor(name) {
        super(name, "notes");
        this.displayType = "tiles";
    }
}
class Cookbook extends DataObj {
    constructor(name) {
        super(name, "recipe");
        this.groceryListIdx = -1;
    }
}
class DataItem {
    constructor() {
        this.itemVersion = 0;
        this.tags = [];
        this.important = false;
        this.date = +new Date();
    }
}
class ChecklistItem extends DataItem {
    constructor(val) {
        super();
        this.val = val;
        this.checked = false;
        this.notes = "";
    }
}
class ChecklistDivider extends DataItem {
    constructor() {
        super();
        this.val = "-------------------------";
        this.divider = true;
    }  
}
class NoteListItem extends DataItem {
    constructor(title, body) {
        super();
        this.title = title;
        this.body = body;
        this.val = title + body;
        this.locked = false;
    }
}
class Recipe extends DataItem {
    constructor(name) {
        super();
        this.name = name;
        this.servings = 1;
        this.groupSortOrder = [];
        this.ingredience = [];
        this.steps = [];
        this.author = "";
        this.notes = "";
        this.source = "";
        this.prepTime = "";
        this.cookTime = "";
        this.totalTime = "";
    }
}
class Ingredient {
    constructor(item, amt, unit, group) {
        this.ingredient = item;
        if(typeof amt === "string") {
            const split = amt.split("-");
            this.amount = split[0].trim();
            if(split.length === 2) {
                this.range = split[1].trim();
            }
        } else if(typeof amt === "number") {
            this.amount = amt;
        } else {
            this.amount = amt.valueOf();
            this.fraction = amt;
        }
        this.unit = unit;
        this.group = group;
    }
}
class Step {
    constructor(text) {
        this.step = text;
        this.checked = false;
    }
}
class Tag {
    constructor(tag, color, imgVal, sortOrder, id) {
        this.tagVersion = 0;
        this.id = id || data.GetGUID();
        this.tag = tag;
        this.color = color;
        this.imgVal = imgVal;
        this.sortOrder = sortOrder;
    }
}
let dbData = {
    _id: "databee",
    dbList: [],
    recycleBin: [], 
    dbVersion: 0,
    currentScreen: -1,
    settings: {
        theme: 0, 
        leftHanded: false
    }
};
const data = {
    IsManualSorting: function(dataIdx) { return dbData.dbList[dataIdx || dbData.currentScreen].sortType === "manual"; },
    AddressVersionChanges: function() {
        if(upgrades.UpgradeDatabase(dbData)) {
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
        for(let j = 0; j < clist.data.length; j++) {
            const obj = clist.data[j];
            obj.tags = obj.tags.filter(e => e !== tagId);
        }
        if(dontSave !== true) { data.Save(); }
    },
    ReorderTags: function(dataIdx, tagId, newPos, dontSave) {
        const clist = dbData.dbList[dataIdx];
        const oldPos = clist.tags[tagId].sortOrder;
        if(oldPos === newPos) { return; }
        const dir = (newPos > oldPos) ? 1 : -1;
        for(const id in clist.tags) {
            const e = clist.tags[id];
            if(id === tagId) {
                e.sortOrder = newPos;
            } else if(dir > 0 && e.sortOrder <= newPos && e.sortOrder > oldPos) {
                e.sortOrder -= 1;
            } else if(dir < 0 && e.sortOrder >= newPos && e.sortOrder < oldPos) {
                e.sortOrder += 1;
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
        dbData.dbList.forEach(e => {
            if(e.type === "recipe" && e.groceryListIdx === dataIdx) { e.groceryListIdx = -1; }
        });
        dbData.recycleBin = dbData.recycleBin.filter(e => e.ownerIdx !== dataIdx);
        if(dontSave !== true) { data.Save(DrawSidebar); }
    },
    SwapDatas: function(oldIdx, newIdx, dontSave) {
        const cookbookGroceryInfo = dbData.dbList.map((e, i) => 
                                                    e.type === "recipe"
                                                        ? [i, isNaN(e.groceryListIdx)
                                                            ? undefined
                                                            : dbData.dbList[e.groceryListIdx].name]
                                                        : [i, undefined])
                                                .filter(e => e[1] !== undefined);
        const trashInfo = dbData.recycleBin.map((e, i) => [i, dbData.dbList[e.ownerIdx].name]);
        const currentName = CurList().name;
        const elem = dbData.dbList[oldIdx];
        dbData.dbList.splice(oldIdx, 1);
        dbData.dbList.splice(newIdx, 0, elem);
        for(let i = 0; i < dbData.dbList.length; i++) {
            const list = dbData.dbList[i];
            if(list.name === currentName) {
                dbData.currentScreen = i;
            }
            const affectedCookbooks = cookbookGroceryInfo.filter(e => e[1] === list.name);
            affectedCookbooks.forEach(e => {
                dbData.dbList[e[0]].groceryListIdx = i;
            });
            const affectedTrash = trashInfo.filter(e => e[1] === list.name);
            affectedTrash.forEach(e => {
                dbData.recycleBin[e[0]].ownerIdx = i;
            });
        }
        if(dontSave !== true) { data.Save(); }
    },
    AddDataItem: function(dataIdx, elem, dontSave) {
        dbData.dbList[dataIdx].data.push(elem);
        data.SortDataItems(dataIdx);
        if(dontSave !== true) { data.Save(); }
    },
    DeleteDataItem: function(dataIdx, elemIdx, dontSave) {
        const oldItem = dbData.dbList[dataIdx].data.splice(elemIdx, 1)[0];
        if(oldItem.divider !== true) {
            oldItem.ownerIdx = dataIdx;
            if(dbData.recycleBin.length === 30) { dbData.recycleBin.shift(); }
            dbData.recycleBin.push(oldItem);
        }
        if(dontSave !== true) { data.Save(); }
    },
    RestoreDataItem: function(dataIdx, elemIdx, dontSave) {
        const oldItem = dbData.recycleBin.splice(elemIdx, 1)[0];
        delete oldItem.ownerIdx;
        delete oldItem.ownerName;
        dbData.dbList[dataIdx].data.push(oldItem);
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
                    const atags = a.tags.map(tagId => `${allTags[tagId].sortOrder}`.padStart(4, "0")).sort().join("") || "zzzzz";
                    const btags = b.tags.map(tagId => `${allTags[tagId].sortOrder}`.padStart(4, "0")).sort().join("") || "zzzzz";
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
        elem.tags = [];
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
        if(name !== undefined) { elem.val = name; elem.name = name; }
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
    ToggleLockNoteListItem: function(dataIdx, elemIdx, dontSave) {
        const list = dbData.dbList[dataIdx].data;
        if(elemIdx < 0 || elemIdx >= list.length) { return; }
        const elem = list[elemIdx];
        elem.locked = !elem.locked;
        if(dontSave !== true) { data.Save(); }
    },
    ClearCompletedChecklistItems: function(dataIdx, dontSave) {
        const list = dbData.dbList[dataIdx].data;
        dbData.dbList[dataIdx].data = list.filter(e => e.checked === false);
        if(dontSave !== true) { data.Save(); }
    },
    AddRecipeIngredient: function(dataIdx, recipeIdx, ingredient, dontSave) {
        const list = dbData.dbList[dataIdx];
        const recipe = list.data[recipeIdx];
        recipe.ingredience.push(ingredient);
        if(dontSave !== true) { data.Save(); }
    },
    ReplaceRecipeIngredient: function(dataIdx, recipeIdx, ingredientIdx, ingredient, dontSave) {
        const list = dbData.dbList[dataIdx];
        const recipe = list.data[recipeIdx];
        recipe.ingredience[ingredientIdx] = ingredient;
        if(dontSave !== true) { data.Save(); }
    },
    RemoveRecipeIngredient: function(dataIdx, recipeIdx, ingredientIdx, dontSave) {
        const list = dbData.dbList[dataIdx];
        const recipe = list.data[recipeIdx];
        recipe.ingredience.splice(ingredientIdx, 1);
        if(dontSave !== true) { data.Save(); }
    },
    AddRecipeStep: function(dataIdx, recipeIdx, step, dontSave) {
        const list = dbData.dbList[dataIdx];
        const recipe = list.data[recipeIdx];
        recipe.steps.push(step);
        if(dontSave !== true) { data.Save(); }
    },
    ReplaceRecipeStep: function(dataIdx, recipeIdx, stepIdx, step, dontSave) {
        const list = dbData.dbList[dataIdx];
        const recipe = list.data[recipeIdx];
        recipe.steps[stepIdx] = step;
        if(dontSave !== true) { data.Save(); }
    },
    ToggleRecipeStepCheck: function(dataIdx, recipeIdx, stepIdx, dontSave) {
        const list = dbData.dbList[dataIdx];
        const recipe = list.data[recipeIdx];
        recipe.steps[stepIdx].checked = !recipe.steps[stepIdx].checked;
        if(dontSave !== true) { data.Save(); }
    },
    ClearRecipeStepChecks: function(dataIdx, recipeIdx, dontSave) {
        const list = dbData.dbList[dataIdx];
        const recipe = list.data[recipeIdx];
        recipe.steps.forEach(e => e.checked = false);
        if(dontSave !== true) { data.Save(); }
    },
    RemoveRecipeStep: function(dataIdx, recipeIdx, stepIdx, dontSave) {
        const list = dbData.dbList[dataIdx];
        const recipe = list.data[recipeIdx];
        recipe.steps.splice(stepIdx, 1);
        if(dontSave !== true) { data.Save(); }
    },
    SearchDataItems: function(query) {
        const results = [];
        const queryWords = query.trim().split(" ");
        dbData.dbList.forEach((arr, arrIdx) => {
            arr.data.forEach((elem, elemIdx) => {
                if(elem.val === undefined) { elem.val = elem.name; } // lazy hack for recipes
                let rank = 0;
                if(elem.divider === true) { return; }
                const arrName = arr.name.toLowerCase();
                if(arrName.indexOf(query) >= 0) {
                    rank += 50;
                } else {
                    for(let i = 0; i < queryWords.length; i++) {
                        if(arrName === queryWords[i]) {
                            rank += 15;
                        } else {
                            const idx = arrName.indexOf(queryWords[i]);
                            if(idx >= 0) { rank += idx === 0 ? 20 : 5; }
                        }
                    }
                }
                const elemStr = elem.val.toLowerCase();
                if(elemStr.indexOf(query) >= 0) {
                    rank += 1000;
                } else {
                    for(let i = 0; i < queryWords.length; i++) {
                        if(elemStr === queryWords[i]) {
                            rank += 20;
                        } else {
                            const idx = elemStr.indexOf(queryWords[i]);
                            if(idx >= 0) { rank += idx === 0 ? 20 : 5; }
                        }
                    }
                }
                for(let i = 0; i < elem.tags.length; i++) {
                    const tagStr = arr.tags[elem.tags[i]].tag.toLowerCase();
                    if(tagStr.indexOf(query) >= 0) {
                        rank += 50;
                    } else {
                        for(let i = 0; i < queryWords.length; i++) {
                            if(tagStr === queryWords[i]) {
                                rank += 20;
                            } else {
                                const idx = tagStr.indexOf(queryWords[i]);
                                if(idx >= 0) { rank += idx === 0 ? 20 : 5; }
                            }
                        }
                    }
                }
                if(rank > 0) {
                    elem.ownerName = arr.name;
                    elem.ownerIdx = arrIdx;
                    elem.myIdx = elemIdx;
                    elem.listType = arr.type;
                    results.push({ rank: rank, elem: elem });
                }
            });
        });
        results.sort((a, b) => {
            if(a.rank > b.rank) { return -1; }
            if(a.rank < b.rank) { return 1; }
            return 0;
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
    ImportBackupChooser: function(file) {
        const decodedData = data.GetJSONFromChooser(file);
        if(decodedData === false) { return; }
        data.ProcessBackupJSON(decodedData);
    },
    ImportBackup: function(files) {
        const reader = new FileReader();
        reader.onload = function(e) { data.ProcessBackupJSON(e.target.result); };
        reader.onerror = function() { ShowAlert("Import Failed", "Reading file as text was unsuccessful."); };
        reader.readAsText(files[0]);
    },
    ProcessBackupJSON: function(str) {
        try {
            const oldRev = dbData._rev;
            const placeholder = typeof str === "object" ? str :JSON.parse(str.replace("javascript:", ""));
            if(!validation.EnsureValidDatabase(placeholder)) {
                ShowAlert("Import Failed", "Invalid databee format.");
                return;
            }
            dbData = placeholder;
            dbData._rev = oldRev;
            data.Save(function() {
                ShowAlert("Import Succeeded!", "Your database is now up-to-date!");
                DrawSidebar();
            });
        } catch {
            ShowAlert("Import Failed", "Invalid databee json format.");
        }
    },
    ImportListChooser: function(file) {
        const decodedData = data.GetJSONFromChooser(file);
        if(decodedData === false) { return; }
        data.ProcessListJSON(decodedData);
    },
    ImportList: function(files) {
        const reader = new FileReader();
        reader.onload = function(e) { data.ProcessListJSON(e.target.result); };
        reader.onerror = function() { ShowAlert("Import Failed", "Reading file as text was unsuccessful."); };
        reader.readAsText(files[0]);
    },
    ProcessListJSON: function(str) {
        try {
            const list = typeof str === "object" ? str :JSON.parse(str.replace("javascript:", ""));
            upgrades.UpgradeList(list);
            if(!validation.EnsureValidList(list, false)) {
                ShowAlert("Import Failed", "Invalid databee list format.");
                return;
            }
            const originalName = list.name;
            let uniqueName = false, i = 0, newName = list.name;
            while(!uniqueName) {
                const hasOthers = dbData.dbList.some(e => e.name === newName);
                if(hasOthers) {
                    newName = `${list.name} (${i++})`;
                } else {
                    list.name = newName;
                    uniqueName = true;
                }
            }
            dbData.dbList.push(list);
            data.Save(function() {
                if(originalName === newName) {
                    ShowAlert("Import Succeeded!", Sanitize`Your list <em>${originalName}</em> has been imported!`);
                } else {
                    ShowAlert("Import Succeeded!", Sanitize`Your list <em>${originalName}</em> has been imported as <em>${newName}</em>!`);
                }
                DrawSidebar();
            });
        } catch {
            ShowAlert("Import Failed", "Invalid list json format.");
        }
    },
    
    ImportRecipeChooser: function(file) {
        const decodedData = data.GetJSONFromChooser(file);
        if(decodedData === false) { return; }
        data.ProcessRecipeJSON(decodedData);
    },
    ImportRecipe: function(files) {
        const reader = new FileReader();
        reader.onload = function(e) { data.ProcessRecipeJSON(e.target.result); };
        reader.onerror = function() { ShowAlert("Import Failed", "Reading file as text was unsuccessful."); };
        reader.readAsText(files[0]);
    },
    ProcessRecipeJSON: function(str) {
        try {
            let msg = "Your recipes have been imported!";
            const list = CurList();
            const recipeResponse = typeof str === "object" ? str : JSON.parse(str.replace("javascript:", ""));
            if(Array.isArray(recipeResponse)) { // more than one
                let success = true;
                recipeResponse.forEach(recipe => {
                    upgrades.UpgradeDataItem(recipe);
                    success &= validation.EnsureValidDataItem(recipe, list, true);
                });
                if(!success) {
                    ShowAlert("Import Failed", "Invalid databee recipe format.");
                    return;
                }
                console.log(recipeResponse);
                list.data.push(...recipeResponse);
            } else { // just one recipe
                upgrades.UpgradeDataItem(recipeResponse);
                if(!validation.EnsureValidDataItem(recipeResponse, list, true)) {
                    ShowAlert("Import Failed", "Invalid databee recipe format.");
                    return;
                }
                list.data.push(recipeResponse);
                msg = Sanitize`Your recipe <em>${recipeResponse.name}</em> have been imported!`;
            }
            data.Save(function() {
                ShowAlert("Import Succeeded!", msg);
                DrawMain();
            });
        } catch {
            ShowAlert("Import Failed", "Invalid recipe json format.");
        }
    },
    GetJSONFromChooser: function(file) {
        const dObj = file.dataURI;
        const prefix = "data:application/octet-stream;base64,";
        if(dObj.indexOf(prefix) !== 0) {
            ShowAlert("Import Failed", "Invalid databee format.");
            return false;
        }
        // https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
        return decodeURIComponent(window.atob(dObj.replace(prefix, "")).split("").map(c => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`).join(""));

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
const validation = {
    EnsureValidDatabase: function(db) {
        console.log(db);
        if(typeof db._id !== "string"
        || typeof db._rev !== "string"
        || typeof db.dbList !== "object"
        || typeof db.settings !== "object"
        || typeof db.currentScreen !== "number") {
            return false;
        }
        if(db._id !== "databee") { return false; }
        upgrades.UpgradeDatabase(db);
        const validDBKeys = ["_id", "_rev", "dbVersion", "dbList", "currentScreen", "settings", "hiddenComments"];
        for(const key in db) {
            if(validDBKeys.indexOf(key) < 0) { delete db[key]; }
        }
        const validSettings = ["theme", "leftHanded", "hiddenComments"];
        for(const key in db.settings) {
            if(validSettings.indexOf(key) < 0) { delete db.settings[key]; }
        }
        if(typeof db.settings.theme !== "number" || typeof db.settings.leftHanded !== "boolean") { return false; }
        if(db.settings.theme < 0 || db.settings.theme >= themes.length) { return false; }
        for(let i = 0; i < db.dbList.length; i++) {
            const valid = validation.EnsureValidList(db.dbList[i], true, db.dbList);
            if(!valid) { return false; }
        }
        return true;
    },
    EnsureValidList: function(list, fromDB, dbList) {
        console.log(list);
        if(typeof list.name !== "string"
        || typeof list.type !== "string"
        || typeof list.data !== "object"
        || typeof list.tags !== "object"
        || typeof list.sortDir !== "number"
        || typeof list.sortType !== "string"
        || typeof list.carousel !== "boolean"
        || typeof list.tagFilters !== "object") {
            return false;
        }
        if(list.tagFilters.some(e => (typeof e !== "string"))) {
            return false;
        }
        if(typeof list.date !== "number") {
            list.date = +new Date();
        }
        switch(list.type) {
            case "checklist":
                if(typeof list.filterChecks !== "boolean" 
                || typeof list.advancedView !== "boolean") { 
                    return false;
                }
                break;
            case "notes":
                if(typeof list.displayType !== "string") { 
                    return false;
                }
                break;
            case "recipe":
                if(fromDB) {
                    const gIdx = list.groceryListIdx;
                    console.log(gIdx);
                    if(isNaN(gIdx) || gIdx < 0 || gIdx >= dbList.length) {
                        list.groceryListIdx = -1;
                    } else {
                        const groceryList = dbList[gIdx];
                        if(groceryList.type !== "checklist") {
                            list.groceryListIdx = -1;
                        }
                    }
                } else {
                    delete list.groceryListIdx;
                }
                break;
            default: return false;
        }

        const validListKeys = ["listVersion", "tagFilters", "name", "type", "data", "tags", "sortDir", "sortType", "date", "carousel",
                               "filterChecks", "advancedView", "displayType", "groceryListIdx", "hiddenComment"];
        for(const key in list) {
            if(validListKeys.indexOf(key) < 0) { delete list[key]; }
        }
        for(const key in list.tags) {
            const valid = validation.EnsureValidTag(list.tags[key]);
            if(!valid) { return false; }
        }
        for(let i = 0; i < list.data.length; i++) {
            const valid = validation.EnsureValidDataItem(list.data[i], list);
            if(!valid) { return false; }
        }
        return true;
    },
    EnsureValidTag: function(item) {
        console.log(item);
        if(typeof item.id !== "string"
        || typeof item.tag !== "string"
        || typeof item.color !== "number"
        || typeof item.imgVal !== "string"
        || typeof item.sortOrder !== "number") {
            return false;
        }
        const validItemKeys = ["tagVersion", "id", "tag", "color", "imgVal", "sortOrder", "hiddenComment"];
        for(const key in item) {
            if(validItemKeys.indexOf(key) < 0) { delete item[key]; }
        }
        return true;
    },
    EnsureValidDataItem: function (item, list, isSoloImport) {
        console.log(item);
        if(typeof item.tags !== "object"
        || typeof item.important !== "boolean"
        || typeof item.date !== "number") {
            return false;
        }
        for(let i = item.tags.length - 1; i >= 0; i--) {
            const tag = item.tags[i];
            if(typeof list.tags[tag] === "undefined" && !isSoloImport) {
                item.tags.splice(i, 1);
            }
        }
        const validItemKeys = ["itemVersion", "tags", "important", "date", "val", "hiddenComment"];
        switch(list.type) {
            case "checklist": return this.EnsureValidChecklistItem(item, validItemKeys); 
            case "notes": return this.EnsureValidNote(item, validItemKeys); 
            case "recipe": return this.EnsureValidRecipe(item, validItemKeys, isSoloImport, list);
            default: return false;
        }
    },
    EnsureValidChecklistItem: function(item, parentKeys) {
        if(typeof item.divider === "boolean") {
            if(item.divider === false
            || typeof item.val !== "string"
            || typeof item.checked !== "undefined"
            || typeof item.notes !== "undefined") {
                return false;
            }
        } else {
            if(typeof item.val !== "string"
            || typeof item.checked !== "boolean"
            || typeof item.notes !== "string"
            || typeof item.divider !== "undefined") {
                return false;
            }
        }
        const validItemKeys = ["checked", "notes", "divider", ...parentKeys];
        for(const key in item) {
            if(validItemKeys.indexOf(key) < 0) { delete item[key]; }
        }
        return true;
    },
    EnsureValidNote: function(item, parentKeys) {
        if(typeof item.val !== "string"
        || typeof item.title !== "string"
        || typeof item.body !== "string"
        || (typeof item.locked !== "boolean" && typeof item.locked !== "undefined")) {
            return false;
        }
        const validItemKeys = ["title", "body", "locked", ...parentKeys];
        for(const key in item) {
            if(validItemKeys.indexOf(key) < 0) { delete item[key]; }
        }
        return true;
    },
    EnsureValidRecipe: function(item, parentKeys, isSoloImport, newList) {
        if(isSoloImport) {
            for(let i = item.tags.length - 1; i >= 0; i--) {
                const tag = item.tags[i];
                if(typeof newList.tags[tag] === "undefined") { // no ID match, try name match
                    let found = false;
                    for(const tagId in newList.tags) {
                        const potentialTag = newList.tags[tagId];
                        if(potentialTag.tag === tag) {
                            item.tags[i] = tagId;
                            found = true;
                            break;
                        }
                    }
                    if(!found) { item.tags.splice(i, 1); }
                }
            }
        }

        if((typeof item.val !== "string" && typeof item.val !== "undefined")
        || typeof item.name !== "string"
        || isNaN(item.servings)
        || typeof item.ingredience !== "object"
        || typeof item.steps !== "object"
        || typeof item.author !== "string"
        || typeof item.notes !== "string"
        || typeof item.source !== "string"
        || typeof item.prepTime !== "string"
        || typeof item.cookTime !== "string"
        || typeof item.totalTime !== "string") {
            return false;
        }
        if(typeof item.groupSortOrder === "undefined") {
            item.groupSortOrder = [];
        } else if(typeof item.groupSortOrder === "object") {
            if(item.groupSortOrder.some(e => typeof e !== "string")) {
                return false;
            }
        } else { return false; }
        const validIngKeys = ["ingredient", "amount", "unit", "group", "hiddenComment"];
        for(let i = 0; i < item.ingredience.length; i++) {
            const ing = item.ingredience[i];
            console.log(ing);
            if(typeof ing.ingredient !== "string"
            || typeof ing.unit !== "string") {
                return false;
            }
            if(typeof ing.group !== "string") { ing.group = ""; }
            if(ing.amount !== "") { new Fraction(ing.amount); }
            for(const key in ing) {
                if(validIngKeys.indexOf(key) < 0) { delete ing[key]; }
            }
        }
        const validStepKeys = ["step", "checked", "hiddenComment"];
        for(let i = 0; i < item.steps.length; i++) {
            const step = item.steps[i];
            console.log(step);
            if(typeof step === "string") {
                item.steps[i] = new Step(step);
            } else {
                if(typeof step.step !== "string"
                || typeof step.checked !== "boolean") {
                    return false;
                }
                for(const key in step) {
                    if(validStepKeys.indexOf(key) < 0) { delete step[key]; }
                }
            }
        }
        const validItemKeys = ["name", "servings", "ingredience", "steps", "author", "notes", "source", "prepTime", "cookTime", "totalTime", "groupSortOrder", ...parentKeys];
        for(const key in item) {
            if(validItemKeys.indexOf(key) < 0) { delete item[key]; }
        }
        return true;
    }
};
const upgrades = {
    UpgradeDatabase: function(db) {
        let hasChanges = false;
        if(typeof db.dbVersion === "undefined" || typeof db.dbVersion !== "number") {
            db.dbVersion = 0;
        }
        // db changes
        db.dbList.forEach(list => {
            hasChanges |= upgrades.UpgradeList(list);
        });
        return hasChanges;
    },
    UpgradeList: function(list) {
        let hasChanges = false;
        if(typeof list.listVersion === "undefined" || typeof list.listVersion !== "number") {
            list.listVersion = 0;
        }
        if(list.listVersion < 1) {
            list.listVersion = 1;
            list.tagFilters = [];
            hasChanges = true;
        }
        if(list.listVersion < 2) {
            list.listVersion = 2;
            list.tagFilterAnd = false;
            hasChanges = true;
        }
        Object.keys(list.tags).forEach(key => {
            const tag = list.tags[key];
            hasChanges |= upgrades.UpgradeTag(tag);
        });
        list.data.forEach(item => {
            hasChanges |= upgrades.UpgradeDataItem(item);
        });
        return hasChanges;
    },
    UpgradeTag: function(tag) {
        let hasChanges = false;
        if(typeof tag.tagVersion === "undefined" || typeof tag.tagVersion !== "number") {
            tag.tagVersion = 0;
        }
        // tag changes
        return hasChanges;
    },
    UpgradeDataItem: function(item) {
        let hasChanges = false;
        if(typeof item.itemVersion === "undefined" || typeof item.itemVersion !== "number") {
            item.itemVersion = 0;
        }
        // item changes
        return hasChanges;
    }
};