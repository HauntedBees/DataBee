const db = new PouchDB("databee");
const ctx = {
    stateForBackButton: "home",
    isSorting: false, 
    tagsToDelete: [],
    beeIdx: 0, bees: []
};
$(function() {
    data.Load(DrawAll);

    if(window.innerHeight < window.innerWidth && navigator.userAgent.indexOf("Firefox") >= 0) {
        ShowAlert("Firefox Mysteries", "Heads up, this app is geared towards mobile devices. It technically works on PCs, too, but it behaves a bit strangely in Firefox. You're doing the right thing by using Firefox over other, less privacy-respecting, browsers, but in the case of this specific app, try using a mobile device or another browser. If you REALLY want to use this app in Firefox on PC, let me know and if enough people complain I might just try to fix things up for y'all. Until then, tread carefully and expect some weird visual bugs.");
        $(".modal > div").css("margin-top", "10%");
    }

    // Settings
    $(".box").on("click", function() {
        const newTheme = parseInt($(this).attr("data-id"));
        $(Sanitize`#themes .box.theme${dbData.settings.theme}`).html("");
        $(Sanitize`#themes .box.theme${newTheme}`).html(`<i class="material-icons">check</i>`);
        dbData.settings.theme = newTheme;
        SetTheme();
        data.Save();
    });
    $("#backBtn").on("click", function() {
        if(ctx.stateForBackButton === "recipeeditor") {
            const recipeIdx = parseInt($("#bRecipeEditor").attr("data-id"));
            ViewRecipe(recipeIdx);
        } else {
            $("#bChecklist, #menuBtn, #menuRight").show();
            $("#bSettings, #bCredits, #bSearch, #backBtn, #recipeTopBtns").hide();
            ReturnToMain();
        }
    });
    $(".settingsButton").on("click", function() {
        const newVal = $(this).attr("data-val") !== "true";
        data.ChangeSetting($(this).attr("data-setting"), newVal);
        if(newVal) {
            $(this).addClass("button-primary").text("Enabled").attr("data-val", newVal);
        } else {
            $(this).removeClass("button-primary").text("Disabled").attr("data-val", newVal);
        }
        if($(this).attr("data-setting") === "showBees") { ReadyTheBees(); }
    });
    $("#btnDeleteAll").on("click", function() {
        ShowInfoModal("deleteAll", "Erase All Data", "Are you sure you want to delete <em>everything</em>? This cannot be undone. As a reminder, this app shares no data with the internet or cloud or whatever; only you can access this data.", "Delete");
    });
    $("#sidebarData").sortable({
        delay: 100,
        handle: ".handle",
        start: StartSort, stop: EndSort,
        update: function(e) {
            if(e === undefined || e.originalEvent === undefined || e.originalEvent.target === undefined) { return; }
            const $me = $(e.originalEvent.target).closest("li");
            const oldIdx = parseInt($me.attr("data-id"));
            const newIdx = $("#sidebarData > li").index($me[0]);
            data.SwapDatas(oldIdx, newIdx);
            DrawSidebar();
            SetScroller("prevScroller", dbData.currentScreen, -1);
            SetScroller("nextScroller", dbData.currentScreen, 1);
        }
    });
    $("#btnExport").on("click", function() {
        const b = new Blob([JSON.stringify(dbData, null, 2)], { type: "application/json" });
        if(typeof cordova !== "undefined") {
            window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory + "Download", function(entry) {
                entry.getFile(`databee_${+new Date()}.json`, { create: true, exclusive: false }, function(file) {
                    file.createWriter(function(writer) {
                        writer.onwriteend = function() { ShowAlert("Export Successful!", "Check your Download folder!"); }
                        writer.onerror = function(e) { ShowAlert("Export Failed", e); }
                        writer.write(b);
                    });
                }, function(e) { ShowAlert("File Export Failed", e) });
            }, function(e) { ShowAlert("Directory Export Failed", e)});
        } else {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(b);
            a.download = `databee_${+new Date()}.json`;
            a.dispatchEvent(new MouseEvent("click"));
        }
    });
    $("#btnImport").on("click", function() { ShowImportModal("Backup"); });

    $("#nextScroller, #prevScroller").on("click", function() {
        const listIdx = $(this).attr("data-idx");
        SelectDatalist.call($(Sanitize`#sidebarData > li[data-id='${listIdx}']`));
    });

    // Sidebar
    $("#menuBtn").on("click", ShowSidebar);
    $("#cover").on("click", HideSidebars);
    $("#sidebarData").on("click", "li", SelectDatalist);
    $("#btnSettings").on("click", ShowSettings);
    $("#btnBin").on("click", ShowRecycleBin);
    $("#btnCredits").on("click", ShowCredits);
    $("#btnHelp").on("click", ShowHelp);
    $("#btnSearch").on("click", ShowSearch);
    $("#searchText").on("keyup", function() { DoSearch($(this).val().toLowerCase()); });

    // Rightbar
    $("#menuRight").on("click", ShowRightbar);
    $("#renameChecklist").on("click", function() {
        ShowInputModal("renameChecklist", Sanitize`Rename <em>${CurList().name}</em>.`, "New List Name", "Rename");
    });
    $("#deleteChecklist").on("click", function() {
        ShowInfoModal("deleteChecklist", Sanitize`Delete <em>${CurList().name}</em>.`, Sanitize`Are you sure you want to delete the <em>${CurList().name}</em> list and all of its items? This cannot be undone.`, "Delete");
    });
    $("#btnConfirmModalInput").on("click", function() {
        const $txtBox = $("#txtModalInput");
        const changeType = $("#modalInput").attr("data-type");
        const val = $txtBox.val();
        if(val === "" && changeType !== "editNotes") {
            $txtBox.addClass("comeOn");
            return;
        }
        $txtBox.removeClass("comeOn");
        const idx = parseInt($("#modalInput").attr("data-id"));
        switch(changeType) {
            case "renameChecklist":
                if(dbData.dbList.some((e, i) => e.name === val && i !== dbData.currentScreen)) {
                    $txtBox.val(`${val} already exists!`);
                    $txtBox.addClass("comeOn");
                    $txtBox.select();
                    return;
                }
                data.RenameData(dbData.currentScreen, val);
                $("#title").text(val);
                HideSidebars();
                break;
            case "renameItem":
                data.UpdateChecklistItem(dbData.currentScreen, idx, val);
                if(data.IsManualSorting()) {
                    $(Sanitize`#cbitem${idx} > span.itemContainer > span.name, #recipeitem${idx} > span.itemContainer > span.name`).text(val);
                } else {
                    DrawMain();
                }
                break;
            case "editNotes":
                data.UpdateChecklistItem(dbData.currentScreen, idx, undefined, undefined, val);
                DrawMain();
                break;
            case "newItem":
                if(val.match(/^-+$/g) !== null) {
                    data.AddDataItem(dbData.currentScreen, new ChecklistDivider());
                } else {
                    data.AddDataItem(dbData.currentScreen, new ChecklistItem(val));
                }
                DrawMain();
                $txtBox.val("");
                $txtBox.focus();
                return;
            case "newChecklist":
                if(dbData.dbList.some(e => e.name === val)) {
                    $txtBox.val(`${val} already exists!`);
                    $txtBox.addClass("comeOn");
                    $txtBox.select();
                    return;
                }
                data.AddData(new Checklist(val));
                DrawSidebar();
                CloseModal("modalInput");
                ctx.stateForBackButton = "sidebar";
                return;
            case "newNotes":
                if(dbData.dbList.some(e => e.name === val)) {
                    $txtBox.val(`${val} already exists!`);
                    $txtBox.addClass("comeOn");
                    $txtBox.select();
                    return;
                }
                data.AddData(new NoteList(val));
                DrawSidebar();
                CloseModal("modalInput");
                ctx.stateForBackButton = "sidebar";
                return;
            case "newCookbook":
                if(dbData.dbList.some(e => e.name === val)) {
                    $txtBox.val(`${val} already exists!`);
                    $txtBox.addClass("comeOn");
                    $txtBox.select();
                    return;
                }
                data.AddData(new Cookbook(val));
                DrawSidebar();
                CloseModal("modalInput");
                ctx.stateForBackButton = "sidebar";
                return;
            case "newRecipe":
                const newRecipe = new Recipe(val);
                data.AddDataItem(dbData.currentScreen, newRecipe);
                CloseModal("modalInput");
                EditRecipe(CurList().data.length - 1);
                return;
        }
        CloseModal("modalInput");
        ctx.stateForBackButton = "home";
    });
    $("#btnConfirmModalAdv").on("click", function() {
        const $txtBox = $("#txtAdvName");
        const val = $txtBox.val();
        if(val === "") {
            $txtBox.addClass("comeOn");
            return;
        }
        if(val.match(/^-+$/g) !== null) {
            data.AddDataItem(dbData.currentScreen, new ChecklistDivider());
        } else {
            const newItem = new ChecklistItem(val);
            newItem.notes = $("#txtAdvNote").val();
            newItem.tags = $("#advTags > .tag.active").toArray().map(e => $(e).attr("data-id"));
            data.AddDataItem(dbData.currentScreen, newItem);
        }
        DrawMain();
        $txtBox.val("");
        $("#txtAdvNote").val("");
        $("#advTags > .tag.active").removeClass("active");
        $txtBox.focus();
        return;
    });
    $("#removeCompleted").on("click", function() {
        ShowInfoModal("removeCompleted", "Remove Completed Items", "Are you sure you want to remove all completed items? This cannot be undone.", "Clear");
    });
    $("#btnConfirmModalInfo").on("click", function() {
        switch($("#modalInfo").attr("data-type")) {
            case "removeCompleted":
                data.ClearCompletedChecklistItems(dbData.currentScreen);
                HideSidebars();
                DrawMain();
                break;
            case "deleteChecklist":
                data.DeleteData(dbData.currentScreen);
                HideSidebars();
                DrawAll();
                break;
            case "deleteAll":
                db.destroy();
                location.reload();
                break;
        }
        CloseModal("modalInfo");
        ctx.stateForBackButton = "home";
    });
    $("#sortChecklist").on("click", function() {
        const $subList = $("#sortTypes");
        if($subList.hasClass("active")) {
            $subList.hide().removeClass("active");
        } else {
            const mySort = CurList().sortType;
            $("li", $subList).removeClass("active");
            const $child = $(Sanitize`#sort${mySort}`);
            $child.addClass("active");
            if(mySort !== "manual") { AddSortOrderImg($child, mySort); }
            $subList.show().addClass("active");
        }
    });
    $("#sortTypes > li").on("click", function() {
        const currData = CurList();
        const oldSort = currData.sortType;
        const newSort = $(this).attr("data-type");
        if(oldSort === newSort) {
            if(newSort === "manual") { return; }
            currData.sortDir = -currData.sortDir;
            AddSortOrderImg($(this));
        } else {
            $("#sortTypes > li.active").removeClass("active");
            $(this).addClass("active");
            currData.sortType = newSort;
            AddSortOrderImg($(this), newSort);
        }
        data.SortDataItems(dbData.currentScreen);
        DrawMain();
        data.Save();
    });
    $("#checkedItems").on("click", function() {
        const $subList = $("#filterTypes");
        if($subList.hasClass("active")) {
            $subList.hide().removeClass("active");
        } else {
            const doFilterChecks = CurList().filterChecks;
            $("li", $subList).removeClass("active");
            if(doFilterChecks) {
                $("#checkedDown").addClass("active");
            } else {
                $("#checkedFine").addClass("active");
            }
            $subList.show().addClass("active");
        }
    });
    $("#filterTypes > li").on("click", function() {
        const doFilterChecks = $(this).attr("data-val") === "true";
        if(CurList().filterChecks === doFilterChecks) { return; }
        $("#filterTypes > li").removeClass("active");
        if(doFilterChecks) {
            $("#checkedDown").addClass("active");
        } else {
            $("#checkedFine").addClass("active");
        }
        CurList().filterChecks = doFilterChecks;
        data.SortDataItems(dbData.currentScreen);
        DrawMain();
        data.Save();
    });
    $("#checkAll").on("click", function() {
        CurList().data.forEach(e => { e.checked = true });
        data.SortDataItems(dbData.currentScreen);
        data.Save(DrawMain);
        HideSidebars();
    });
    $("#uncheckAll").on("click", function() {
        CurList().data.forEach(e => { e.checked = false });
        data.SortDataItems(dbData.currentScreen);
        data.Save(DrawMain);
        HideSidebars();
    });
    $(".settingToggle").on("click", function() {
        const $subList = $(`#${$(this).attr("data-target")}`);
        if($subList.hasClass("active")) {
            $subList.hide().removeClass("active");
        } else {
            const valueToCheck = CurList()[$(this).attr("data-val")];
            $("li", $subList).removeClass("active");
            $(Sanitize`li[data-val="${valueToCheck}"]`).addClass("active");
            $subList.show().addClass("active");
        }
    });
    $(".settingToggled > li").on("click", function() {
        const $toggler = $(this).parent();
        const newVal = $toggler.attr("data-boolean") === "true" ? $(this).attr("data-val") === "true" : $(this).attr("data-val");
        $toggler.find("li").removeClass("active");
        $toggler.find(Sanitize`li[data-val="${newVal}"]`).addClass("active");
        const key = $toggler.attr("data-val");
        CurList()[key] = newVal;
        DrawMain();
        data.Save();
    });
    $("#shareChecklist").on("click", function() {
        const thisList = CurList();
        const b = new Blob([JSON.stringify(thisList, null, 2)], { type: "application/json" });
        if(typeof cordova !== "undefined") {
            window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory + "Download", function(entry) {
                entry.getFile(`databee_${thisList.name}_${+new Date()}.json`, { create: true, exclusive: false }, function(file) {
                    file.createWriter(function(writer) {
                        writer.onwriteend = function() { ShowAlert("Export Successful!", "Check your Download folder!"); }
                        writer.onerror = function(e) { ShowAlert("Export Failed", e); }
                        writer.write(b);
                    });
                }, function(e) { ShowAlert("File Export Failed", e) });
            }, function(e) { ShowAlert("Directory Export Failed", e)});
        } else {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(b);
            a.download = `databee_${thisList.name}_${+new Date()}.json`;
            a.dispatchEvent(new MouseEvent("click"));
        }
    });
    $("#btnImportList").on("click", function() { ShowImportModal("List"); });
    $("#btnImportFile").on("click", function() {
        const type = $("#modalFileImport").attr("data-type");
        let chooserFunc = null, inputFuncStr = null;
        switch(type) {
            case "Backup":
                chooserFunc = data.ImportBackupChooser;
                inputFuncStr = "data.ImportBackup(this.files)";
                break;
            case "List":
                chooserFunc = data.ImportListChooser;
                inputFuncStr = "data.ImportList(this.files)";
                break;
            case "Recipe":
                chooserFunc = data.ImportRecipeChooser;
                inputFuncStr = "data.ImportRecipe(this.files)";
                break;
            default: return;
        }
        if(typeof chooser !== "undefined") {
            chooser.getFile("application/octet-stream").then(chooserFunc, function(e) { ShowAlert("Import Failed", e); });
        } else {
            const input = document.createElement("input");
            input.setAttribute("type", "file");
            input.setAttribute("accept", ".json");
            input.setAttribute("onchange", inputFuncStr);
            input.dispatchEvent(new MouseEvent("click"));
        }
        CloseModal("modalFileImport");
    });
    $("#btnImportURL").on("click", function() {
        $("#txtImportURL").removeClass("comeOn");
        const url = $("#txtImportURL").val();
        if(url === "") {
            $("#txtImportURL").addClass("comeOn").val("Please enter a value.").focus().select();
            return;
        }
        if(url.indexOf("https://") !== 0) {
            $("#txtImportURL").addClass("comeOn").val("Only https URLs are supported.").focus().select();
            return;
        }
        const type = $("#modalFileImport").attr("data-type");
        switch(type) {
            case "Backup": online.GetBackupFromURL(url); break;
            case "List": online.GetListFromURL(url); break;
            case "Recipe": online.GetRecipeFromURL(url); break;
            default: return;
        }
        CloseModal("modalFileImport");
    });

    // Tags
    $("#manageTags").on("click", ShowTagEditor);
    $("#btnAddTagModal").on("click", ShowEditTagModal);
    $("#tagColorList > .tagColorSelector").on("click", function() {
        const id = $(this).attr("data-id");
        $("#tagColorList > .tagColorSelector").removeClass("active");
        $(this).addClass("active");
        $("#tagColorList").attr("data-selectedColor", id);
        document.documentElement.style.setProperty("--current-tag-color", $(this).attr("data-color"));
    });
    $("#tagIconList > .tagImgSelector").on("click", function() {
        const id = $(this).attr("data-id");
        $("#tagIconList > .tagImgSelector").removeClass("active");
        $(this).addClass("active");
        $("#tagColorList").attr("data-selectedImg", id);
    });
    $("#btnConfirmModalTagEdit").on("click", function() {
        const tagText = $("#txtModalTagInput").val() || "Unnamed Tag";
        const colorIdx = parseInt($("#tagColorList").attr("data-selectedColor"));
        const imgText = $("#tagColorList").attr("data-selectedImg");
        const tagId = $("#modalTagEdit").attr("data-id");
        if(tagId === "") {
            const tag = new Tag(tagText, colorIdx, imgText, Object.keys(CurList().tags).length);
            data.SaveTag(dbData.currentScreen, tag);
        } else {
            const tag = CurList().tags[tagId];
            tag.tag = tagText;
            tag.color = colorIdx;
            tag.imgVal = imgText;
            data.SaveTag(dbData.currentScreen, tag);
        }
        CloseModal("modalTagEdit");
        ShowTagEditor();
    });
    $("#tagData").sortable({
        delay: 100,
        handle: ".handle",
        start: StartSort, stop: EndSort,
        update: function(e) {
            if(e === undefined || e.originalEvent === undefined || e.originalEvent.target === undefined) { return; }
            const $me = $(e.originalEvent.target).closest("li");
            const newIdx = $("#tagData > li").index($me[0]);
            data.ReorderTags(dbData.currentScreen, $me.attr("data-id"), newIdx);
        }
    });
    $("#tagData").on("click", ".editTag", function() {
        const $settings = $(this).parent().find(".tagSettings");
        const buttons = [
            `<button class="button tagSettingsDelete">Delete</button>`,
            `<button class="button-primary tagSettingsEdit">Edit</button>`
        ];
        if(dbData.settings.leftHanded) { buttons.reverse(); }
        if($settings.length === 0) {
            $(this).parent().append(`
            <div class="tagSettings"></div>
            <div class="tagSettings spaced-out">${buttons.join("")}</div>
            <div class="tagSettings"></div><div class="tagSettings"></div>`);
        } else {
            $settings.remove();
        }
    });
    $("#tagData").on("click", ".tagSettingsEdit", function() {
        const id = $(this).closest("li").attr("data-id");
        ShowEditTagModal(id);
    });
    $("#tagData").on("click", ".tagSettingsDelete", function() {
        const id = $(this).closest("li").attr("data-id");
        data.DeleteTag(dbData.currentScreen, id);
        ShowTagEditor();
    });
    $(document).on("click", ".tagList > .tag", function(e) {
        e.stopPropagation();
        const $parent = $(this).closest("li");
        const elemIdx = parseInt($parent.attr("data-id"));
        const tagId = $(this).attr("data-id");
        data.ToggleTag(dbData.currentScreen, elemIdx, tagId);
        if($(this).hasClass("active")) {
            $(Sanitize`[data-id="${tagId}"]`, $parent.find(".tagGroup")).remove();
        } else {
            const allTags = CurList().tags;
            $parent.find(".tagGroup").html(GetTagsHTML(allTags, CurList().data[elemIdx].tags));
        }
        $(this).toggleClass("active");
    });
    $(".tagToggle").on("click", ".tag", function(e) {
        e.stopPropagation();
        $(this).toggleClass("active");
    });
    $("#btnConfirmTagFilter").on("click", function() {
        const list = CurList();
        list.tagFilters = $("#advTagFilters > .tag.active").toArray().map(e => $(e).attr("data-id"));
        list.tagFilterAnd = $("#tagFilterType > .button-primary").attr("data-val") === "true";
        data.Save();
        CloseModal("modalTagFilter");
        DrawMain();
    });
    $("#tagFilter").on("click", ".applyTagFilters", ShowTagFilterModal);
    $("#tagFilterType > button").on("click", function() {
        $("#tagFilterType > button").removeClass("button-primary");
        $(this).addClass("button-primary");
    });
    $("#tagFilter").on("click", ".clearTagFilters", function() {
        const list = CurList();
        list.tagFilters = [];
        data.Save();
        DrawMain();
    });
    
    // Main
    document.addEventListener("backbutton", BackButtonPress, false);
    $("#listData").sortable({
        delay: 100,
        handle: ".handle",
        start: StartSort, stop: EndSort,
        update: function(e) {
            if(e === undefined || e.originalEvent === undefined || e.originalEvent.target === undefined) { return; }
            const $me = $(e.originalEvent.target).closest("li");
            const oldIdx = parseInt($me.attr("data-id"));
            const newIdx = $("#listData > li").index($me[0]);
            data.SwapDataItems(dbData.currentScreen, oldIdx, newIdx);
            DrawMain();
        }
    });
    $("#listData").disableSelection();

    // Modals
    $(".btnCancel").on("click", function() { CloseModal($(this).closest(".modal").attr("id")); });
    window.addEventListener("click", function(e) {
        if(e.target.classList.contains("modal")) {
            CloseModal(e.target.id);
        }
    });
    $("#txtModalInput").on("keyup", function(e) {
        e.preventDefault();
        if(e.keyCode === 13) { $("#btnConfirmModalInput").click(); }
    });
    $("#btnAddItemModal").on("click", function() {
        const currentList = CurList();
        if(currentList.type === "checklist") {
            if(currentList.advancedView) {
                ShowAdvancedAddModal();
            } else {
                ShowInputModal("newItem", "New Item", "New Entry", "Add");
            }
        } else if(currentList.type === "notes") {
            ShowNoteEditor(-1, false);
        } else if(currentList.type === "recipe") {
            ShowInputModal("newRecipe", "New Recipe", "Recipe Name", "Create");
        }
    });

    SetUpCookbook();

    // Note List
    $("#btnAddNotes").on("click", function() { ShowInputModal("newNotes", "New Notes List", "New Notes List", "Create"); });
    $("#btnEditNote, #noteBodyRead").on("click", function() {
        const idx = parseInt($("#bNoteEditor").attr("data-id"));
        ShowNoteEditor(idx, false);
    });
    $(".btnCancelNote").on("click", function() {
        const idx = parseInt($("#bNoteEditor").attr("data-id"));
        if($(this).closest("#noteEdit").length > 0 && idx >= 0) {
            ShowNoteEditor(idx, true);
            return;
        }
        $("#bChecklist, #menuBtn, #menuRight").show();
        $("#bSettings, #bCredits, #bSearch, #backBtn, #recipeTopBtns").hide();
        ReturnToMain();
    });
    $("#btnSaveNote").on("click", function() {
        const idx = parseInt($("#bNoteEditor").attr("data-id"));
        const title = $("#noteTitle").val();
        const body = $("#noteBody").val();
        if(idx < 0) { // Add
            data.AddDataItem(dbData.currentScreen, new NoteListItem(title, body));
        } else { // Edit
            data.UpdateNoteListItem(dbData.currentScreen, idx, title, body);
        }
        ReturnToMain();
    });

    // Checklist
    $("#btnAddChecklist").on("click", function() { ShowInputModal("newChecklist", "New Checklist", "New Checklist", "Create"); });
    $("#listData").on("click", "li.elem", function(e) {
        switch($("#listData").attr("data-type")) {
            case "checklist":
                ChecklistItemClick(e, $(this));
                break;
            case "notes":
                NoteClick(e, $(this));
                break;
            case "recipe":
                RecipeClick(e, $(this));
                break;
        }
    });
    $("#searchData").on("click", "li", function(e) {
        if($(this).hasClass("note")) {
            NoteClick(e, $(this));
        } else if($(this).hasClass("ritem")) {
            RecipeClick(e, $(this));
        } else if($(this).hasClass("cbitem")) {
            ChecklistItemClick(e, $(this));
        }
    });
    $("#listData").on("click", ".deleteDivider", function(e) {
        e.stopPropagation();
        const idx = parseInt($(this).closest(".settings").attr("data-id"));
        data.DeleteDataItem(dbData.currentScreen, idx);
        $(this).closest("li").remove();
        DrawMain();
        ctx.stateForBackButton = "home";
    });
    $("#listData").on("click", ".ci-delete", function(e) {
        e.stopPropagation();
        const idx = parseInt($(this).closest(".settings").attr("data-id"));
        data.DeleteDataItem(dbData.currentScreen, idx);
        $(this).closest("li").remove();
        DrawMain();
        ctx.stateForBackButton = "home";
    });
    $("#listData").on("click", ".ci-lock", function(e) {
        e.stopPropagation();
        const idx = parseInt($(this).closest(".settings").attr("data-id"));
        data.ToggleLockNoteListItem(dbData.currentScreen, idx);
        DrawMain();
        ctx.stateForBackButton = "home";
    });
    $("#listData").on("click", ".ci-rename", function(e) {
        e.stopPropagation();
        const idx = parseInt($(this).closest(".settings").attr("data-id"));
        const name = $(this).closest("li").find(".name").text();
        $(this).closest(".settings").remove();
        ShowInputModal("renameItem", Sanitize`Rename <em>${name}</em>.`, "Entry Name", "Rename", idx);
        $("#txtModalInput").val(name).select();
    });
    $("#listData").on("click", ".ci-notes", function(e) {
        e.stopPropagation();
        const idx = parseInt($(this).closest(".settings").attr("data-id"));
        const notes = data.GetChecklistItemNotes(dbData.currentScreen, idx);
        const name = $(this).closest("li").find(".name").text();
        $(this).closest(".settings").remove();
        ShowInputModal("editNotes", Sanitize`Notes for <em>${name}</em>.`, "Notes", "Save", idx);
        $("#txtModalInput").val(notes).select();
    });
    $("#listData").on("click", ".ci-important", function(e) {
        e.stopPropagation();
        const idx = parseInt($(this).closest(".settings").attr("data-id"));
        data.ToggleDataItemImportance(dbData.currentScreen, idx);
        DrawMain();
        ctx.stateForBackButton = "home";
    });
    $("#listData").on("click", ".ci-tags", function(e) {
        e.stopPropagation();
        const $parent = $(this).closest(".settings");
        const allTagsObj = CurList().tags;
        const allTags = Object.keys(allTagsObj).map(key => allTagsObj[key]);
        const idx = parseInt($parent.attr("data-id"));
        const myTags = CurList().data[idx].tags;
        SetSettingsTagSelectionHTML($(this), $parent, allTags, myTags);
    });
    $("#listData").on("click", ".ci-move", function(e) {
        e.stopPropagation();
        const $parent = $(this).closest(".settings");
        const idx = parseInt($parent.attr("data-id"));
        ShowMoveModal(idx);
    });
    $("#notesListData").on("click", ".ci-edit", function(e) {
        e.stopPropagation();
        ShowNoteEditor(parseInt($(this).closest(".settings").attr("data-id")), false);
    });
    $("#moveChecklists").on("click", "li", function() {
        const listIdx = parseInt($(this).attr("data-id"));
        const moveType = $("#modalMove").attr("data-type");
        if(moveType === "move") {
            const elemIdx = parseInt($("#modalMove").attr("data-id"));
            data.MoveDataItem(dbData.currentScreen, listIdx, elemIdx);
            DrawMain();
            CloseModal("modalMove");
        } else {
            const cookbook = CurList();
            cookbook.groceryListIdx = listIdx;
            data.Save();
            if(listIdx < 0) {
                $("#groceryListName").text("None");
            } else {
                $("#groceryListName").text(dbData.dbList[listIdx].name);
            }
            CloseModal("modalMove");
        }
    });

    // Swipe Handlers
    $(document).on("touchstart", TouchPress);
    $(document).on("touchmove", TouchMove);
    $(document).on("touchend", TouchRelease);
});
function NoteClick(e, $t) {
    const targType = e.target.tagName.toLowerCase();
    const idx = parseInt($t.attr("data-id"));
    const $clicked = $(e.target);
    if($clicked.hasClass("tag")) { return; }
    if($t.find(".restoreItem").length > 0 && targType !== "i") { return; }
    if(targType === "i") { // button
        if($clicked.hasClass("lockedIcon")) {
            ShowNoteEditor(idx, true);
            return;
        }
        if($clicked.closest(".settings").length) { return; } // settings
        if($clicked.hasClass("restoreItem")) { // Recover From Recycle Bin
            const listIdx = $clicked.attr("data-parent");
            data.RestoreDataItem(listIdx, idx);
            ShowRecycleBin();
            return;
        } else if($clicked.hasClass("goToResult")) { // Search
            const listIdx = $clicked.attr("data-parent");
            SelectDatalist.call($(Sanitize`#sidebarData > li[data-id='${listIdx}']`));
            $(`#note${idx} .edit`).click();
            document.documentElement.scrollTop = $(`#note${idx}`).offset().top - 40;
        } else { // Edit
            ToggleDataItemSettings($t, idx, "notes");
        }
        return;
    }
    ShowNoteEditor(idx, true);
}
function ChecklistItemClick(e, $t) {
    const targType = e.target.tagName.toLowerCase();
    const isSearch = $t.find(".goToResult").length > 0;
    const $i = $t.find("input");
    const idx = parseInt($t.attr("data-id"));
    const $clicked = $(e.target);
    if($t.find(".restoreItem").length > 0 && targType !== "i") { return; }
    if(targType === "span" || targType === "li") { // text or main area
        $i.prop("checked", !$i.prop("checked"));
    } else if(targType === "i") { // button
        if($clicked.closest(".settings").length) { return; } // settings
        if($clicked.hasClass("restoreItem")) { // Recover From Recycle Bin
            const listIdx = $clicked.attr("data-parent");
            data.RestoreDataItem(listIdx, idx);
            ShowRecycleBin();
            return;
        } else if($clicked.hasClass("goToResult")) { // Search
            const listIdx = $clicked.attr("data-parent");
            SelectDatalist.call($(Sanitize`#sidebarData > li[data-id='${listIdx}']`));
            $(`#cbitem${idx} .edit`).click();
            document.documentElement.scrollTop = $(`#cbitem${idx}`).offset().top - 40;
        } else { // Edit
            if($clicked.hasClass("dispTag")) { return; }
            ToggleDataItemSettings($t, idx, "checklist");
        }
        return;
    } else if(targType !== "input") { // settings
        return;
    } // otherwise it's the checkbox
    data.UpdateChecklistItem(dbData.currentScreen, idx, undefined, $i.prop("checked"));
    if(isSearch) {
        DoSearch($("#searchText").val().toLowerCase());
    } else {
        DrawMain();
    }
}
function BackButtonPress() {
    if(ctx.stateForBackButton.indexOf("|") > 0) {
        const modalId = ctx.stateForBackButton.split("|")[1];
        CloseModal(modalId);
        return;
    }
    switch(ctx.stateForBackButton) {
        case "recipeeditor":
            const recipeIdx = parseInt($("#bRecipeEditor").attr("data-id"));
            ViewRecipe(recipeIdx);
            break;
        case "noteEditor":
            const idx = parseInt($("#bNoteEditor").attr("data-id"));
            ShowNoteEditor(idx, true);
            break;
        case "secondary":
        case "recipeviewer":
        case "noteReader":
            $("#backBtn").click();
            break;
        case "sidebar":
            HideSidebars();
            break;
        case "checkboxSettings":
            $(".settings").remove();
            ctx.stateForBackButton = "home";
            break;
        case "home":
            navigator.app.exitApp();
            break;
    }
}

// Swiping
let potentialSwitch = false, potentialX = 0;
function StartSort() {
    ctx.isSorting = true;
}
function EndSort() {
    ctx.isSorting = false;
}
function TouchPress(e) {
    if(ctx.stateForBackButton.indexOf("|") >= 0) { return; }
    const touch = e.originalEvent.touches[0];
    potentialSwitch = true;
    potentialX = touch.clientX;
}
function TouchMove(e) {
    if(ctx.isSorting || !potentialSwitch) { return; }
    const touch = e.originalEvent.touches[0];
    const max = window.screen.width;
    const current = touch.clientX;
    const dx = current - potentialX;
    const dP = dx / max;
    if(dP > 0.2) {
        if(ctx.stateForBackButton === "sidebar") {
            HideSidebars();
        } else {
            ShowSidebar();
        }
        potentialSwitch = false;
    } else if(dP < -0.2) {
        if(ctx.stateForBackButton === "sidebar") {
            HideSidebars();
        } else if(ctx.stateForBackButton !== "secondary") {
            ShowRightbar();
        }
        potentialSwitch = false;
    }
}
function TouchRelease() {
    potentialSwitch = false;
}

// Other
function CurList() { return dbData.dbList[dbData.currentScreen]; }
const rWidth = () => window.innerWidth * Math.random();
const rHeight = () => window.innerHeight * Math.random();
function ReadyTheBees() {
    clearInterval(ctx.beeIdx);
    if(dbData.settings.showBees) {
        ctx.beeIdx = setInterval(BeeAnim, 10);
    } else {
        $(".bee").remove();
        ctx.bees = [];
    }
}
function Bee() {
    const dir = Math.floor(Math.random() * 12);
    let sx = 0, sy = 0, ex = 0, ey = 0;
    const gap = -10;
    switch(dir) {
        case 0: sx = -gap; sy = rHeight(); ex = rWidth(); ey = -gap; break; // left to top
        case 1: sx = -gap; sy = rHeight(); ex = window.innerWidth + gap; ey = rHeight(); break; // left to right
        case 2: sx = -gap; sy = rHeight(); ex = rWidth(); ey = window.innerHeight + gap; break; // left to bottom

        case 3: sx = rWidth(); sy = -gap; ex = -gap; ey = rHeight(); break; // top to left
        case 4: sx = rWidth(); sy = -gap; ex = rWidth(); ey = window.innerHeight + gap; break; // top to bottom
        case 5: sx = rWidth(); sy = -gap; ex = window.innerWidth + gap; ey = rHeight(); break; // top to right
        
        case 6: sx = window.innerWidth + gap; sy = rHeight(); ex = rWidth(); ey = -gap; break; // right to top
        case 7: sx = window.innerWidth + gap; sy = rHeight(); ex = -gap; ey = rHeight(); break; // right to left
        case 8: sx = window.innerWidth + gap; sy = rHeight(); ex = rWidth(); ey = window.innerHeight + gap; break; // right to bottom

        case 9: sx = rWidth(); sy = window.innerHeight + gap; ex = -gap; ey = rHeight(); break; // bottom to left
        case 10: sx = rWidth(); sy = window.innerHeight + gap; ex = rWidth(); ey = -gap; break; // bottom to top
        case 11: sx = rWidth(); sy = window.innerHeight + gap; ex = window.innerWidth + gap; ey = rHeight(); break; // bottom to right
    }
    sx -= 10; sy -= 15; ex -= 10; ey -= 15;
    const rads = Math.atan2(ey - sy, ex - sx);
    let drawAngle = (rads * 180 / Math.PI);
    if(navigator.userAgent.indexOf("SM-") >= 0 || navigator.platform.indexOf("iP") === 0) {
        drawAngle += 180; // bee emoji on Samsung and Apple devices faces left
    } else if(navigator.platform.indexOf("Win") === 0 || navigator.platform === "Linux" || navigator.platform === "Android") { // doesn't work on Windows 10 but I'm on 8.1 so bleh
        drawAngle += 90; // bee emoji on Androids and Windows 8.1 faces up
    }   
    const $bee = $(`<div class="bee">&#x1F41D</div>`);
    $bee.css("top", sy).css("left", sx).css("transform", `rotate(${drawAngle}deg)`);
    $("body").append($bee);
    ctx.bees.push({ 
        sx: sx, sy: sy,
        distance: 0, rads: rads, 
        speed: 1 + Math.random() * 2, 
        amplitude: 4 + Math.floor(Math.random() * 8),
        period: 50 + Math.floor(Math.random() * 150),
        $obj: $bee
    });
}
function BeeAnim() {
    if(ctx.bees.length < 5) { Bee(); }
    if(ctx.bees.length < 10 && Math.random() < 0.05) { Bee(); }
    for(let i = ctx.bees.length - 1; i >= 0; i--) {
        const bee = ctx.bees[i];
        bee.distance += bee.speed;
        let x = bee.sx + Math.cos(bee.rads) * bee.distance;
        let y = bee.sy + Math.sin(bee.rads) * bee.distance;
        const deviation = Math.sin(bee.distance * Math.PI / bee.period) * bee.amplitude;
        x += Math.sin(bee.rads) * deviation;
        y -= Math.cos(bee.rads) * deviation;
        if(bee.distance > (window.innerHeight * 1.25)) {
            bee.$obj.remove();
            ctx.bees.splice(i, 1);
        }
        bee.$obj.css("top", y).css("left", x);
    }
}