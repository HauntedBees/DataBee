const db = new PouchDB("databee");
const ctx = {
    stateForBackButton: "home",
    isSorting: false, 
    tagsToDelete: []
};
$(function() {
    data.Load(DrawAll);

    // Settings
    $(".box").on("click", function() {
        const newTheme = parseInt($(this).attr("data-id"));
        $(`#themes .box.theme${dbData.settings.theme}`).html("");
        $(`#themes .box.theme${newTheme}`).html(`<i class="material-icons">check</i>`);
        dbData.settings.theme = newTheme;
        SetTheme();
        data.Save();
    });
    $("#backBtn").on("click", function() {
        $("#bChecklist, #menuBtn, #menuRight").show();
        $("#bSettings, #bCredits, #bSearch, #backBtn").hide();
        ReturnToMain();
    });
    $(".settingsButton").on("click", function() { // TODO: maybe delete?
        const newVal = $(this).attr("data-val") !== "true";
        data.ChangeSetting($(this).attr("data-setting"), newVal);
        if(newVal) {
            $(this).addClass("button-primary").text("Enabled").attr("data-val", newVal);
        } else {
            $(this).removeClass("button-primary").text("Disabled").attr("data-val", newVal);
        }
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
        }
    });
    $("#btnExport").on("click", function() {
        const b = new Blob([JSON.stringify(dbData)], { type: "application/json" });
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
    $("#btnImport").on("click", function() {
        if(typeof chooser !== "undefined") {
            chooser.getFile().then(data.ImportChooser, function(e) { ShowAlert("Import Failed", e); });
        } else {
            const input = document.createElement("input");
            input.setAttribute("type", "file");
            input.setAttribute("accept", ".json");
            input.setAttribute("onchange", "data.Import(this.files)");
            input.dispatchEvent(new MouseEvent("click"));
        }
    });

    $("#nextScroller, #prevScroller").on("click", function() {
        const listIdx = $(this).attr("data-idx");
        SelectDatalist.call($(`#sidebarData > li[data-id='${listIdx}']`));
    });

    // Sidebar
    $("#menuBtn").on("click", ShowSidebar);
    $("#cover").on("click", HideSidebars);
    $("#sidebarData").on("click", "li", SelectDatalist);
    $("#btnSettings").on("click", ShowSettings);
    $("#btnCredits").on("click", ShowCredits);
    $("#btnSearch").on("click", ShowSearch);
    $("#searchText").on("keyup", function() { DoSearch($(this).val().toLowerCase()); });

    // Rightbar
    $("#menuRight").on("click", ShowRightbar);
    $("#renameChecklist").on("click", function() {
        ShowInputModal("renameChecklist", `Rename <em>${dbData.dbList[dbData.currentScreen].name}</em>.`, "New List Name", "Rename");
    });
    $("#deleteChecklist").on("click", function() {
        ShowInfoModal("deleteChecklist", `Delete <em>${dbData.dbList[dbData.currentScreen].name}</em>.`, `Are you sure you want to delete the <em>${dbData.dbList[dbData.currentScreen].name}</em> list and all of its items? This cannot be undone.`, "Delete");
    });
    $("#btnConfirmModalInput").on("click", function() {
        const $txtBox = $("#txtModalInput");
        const val = $txtBox.val();
        if(val === "") {
            $txtBox.addClass("comeOn");
            return;
        }
        $txtBox.removeClass("comeOn");
        const idx = parseInt($("#modalInput").attr("data-id"));
        switch($("#modalInput").attr("data-type")) {
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
                    $(`#cbitem${idx} > span.itemContainer > span.name`).text(val);
                } else {
                    DrawMain();
                }
                break;
            case "editNotes":
                data.UpdateChecklistItem(dbData.currentScreen, idx, undefined, undefined, val);
                DrawMain();
                break;
            case "newItem":
                const newItem = new ChecklistItem(val);
                data.AddDataItem(dbData.currentScreen, newItem);
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
        }
        CloseModal("modalInput");
        ctx.stateForBackButton = "home";
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
            const mySort = dbData.dbList[dbData.currentScreen].sortType;
            $("li", $subList).removeClass("active");
            const $child = $(`#sort${mySort}`);
            $child.addClass("active");
            if(mySort !== "manual") { AddSortOrderImg($child, mySort); }
            $subList.show().addClass("active");
        }
    });
    $("#sortTypes > li").on("click", function() {
        const currData = dbData.dbList[dbData.currentScreen];
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
            const doFilterChecks = dbData.dbList[dbData.currentScreen].filterChecks;
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
        if(dbData.dbList[dbData.currentScreen].filterChecks === doFilterChecks) { return; }
        $("#filterTypes > li").removeClass("active");
        if(doFilterChecks) {
            $("#checkedDown").addClass("active");
        } else {
            $("#checkedFine").addClass("active");
        }
        dbData.dbList[dbData.currentScreen].filterChecks = doFilterChecks;
        data.SortDataItems(dbData.currentScreen);
        DrawMain();
        data.Save();
    });
    $("#viewType").on("click", function() {
        const $subList = $("#viewTypes");
        if($subList.hasClass("active")) {
            $subList.hide().removeClass("active");
        } else {
            const viewType = dbData.dbList[dbData.currentScreen].displayType;
            $("li", $subList).removeClass("active");
            if(viewType === "tiles") {
                $("#viewTile").addClass("active");
            } else {
                $("#viewList").addClass("active");
            }
            $subList.show().addClass("active");
        }
    });
    $("#viewTypes > li").on("click", function() {
        const newViewType = $(this).attr("data-val");
        $("#filterTypes > li").removeClass("active");
        if(viewType === "tiles") {
            $("#viewTile").addClass("active");
        } else {
            $("#viewList").addClass("active");
        }
        dbData.dbList[dbData.currentScreen].displayType = newViewType;
        DrawMain();
        data.Save();
    });
    $("#checkAll").on("click", function() {
        dbData.dbList[dbData.currentScreen].data.forEach(e => { e.checked = true });
        data.SortDataItems(dbData.currentScreen);
        data.Save(DrawMain);
        HideSidebars();
    });
    $("#uncheckAll").on("click", function() {
        dbData.dbList[dbData.currentScreen].data.forEach(e => { e.checked = false });
        data.SortDataItems(dbData.currentScreen);
        data.Save(DrawMain);
        HideSidebars();
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
            const tag = new Tag(tagText, colorIdx, imgText, Object.keys(dbData.dbList[dbData.currentScreen].tags).length);
            data.SaveTag(dbData.currentScreen, tag);
        } else {
            const tag = dbData.dbList[dbData.currentScreen].tags[tagId];
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
        if($settings.length === 0) {
            $(this).parent().append(`
            <div class="tagSettings"></div>
            <div class="tagSettings spaced-out"><button class="button-primary tagSettingsEdit">Edit</button><button class="button tagSettingsDelete">Delete</button></div>
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

    // OLD tag shit
    $("#btnAddNewTag").on("click", function() {
        const max = $("#modalTagList > li").length;
        const newTag = new Tag("", `tagColor${max % 10}`);
        $("#modalTagList").append(GetTagModalHTML(newTag, max));
    });
    $("#btnSaveTags").on("click", function() {
        const newTags = {};
        $("#modalTagList > li").each(function() {
            const text = $("input", this);
            const color = $("div.modalTagColor", this);
            const myId = $(this).attr("data-id");
            newTags[myId] = new Tag((text.val() === "" ? text.attr("placeholder") : text.val()), color.attr("data-color"), myId);
        });
        if(ctx.tagsToDelete.length > 0) { DrawMain(); }
        data.SaveNewTags(dbData.currentScreen, newTags, ctx.tagsToDelete);
        CloseModal("modalTags");
    });
    $(document).on("click", ".deleteTag", function() {
        const $tag = $(this).closest("li");
        const myId = $tag.attr("data-id");
        ctx.tagsToDelete.push(myId);
        $tag.remove();
    });
    
    // Main
    document.addEventListener("backbutton", BackButtonPress, false);
    $("#checkListData").sortable({
        delay: 100,
        handle: ".handle",
        start: StartSort, stop: EndSort,
        update: function(e) {
            if(e === undefined || e.originalEvent === undefined || e.originalEvent.target === undefined) { return; }
            const $me = $(e.originalEvent.target).closest("li");
            const oldIdx = parseInt($me.attr("data-id"));
            const newIdx = $("#checkListData > li").index($me[0]);
            data.SwapDataItems(dbData.currentScreen, oldIdx, newIdx);
            DrawMain();
        }
    });
    $("#checkListData").disableSelection();
    $("#notesListData").sortable({
        delay: 100,
        handle: ".handle",
        start: StartSort, stop: EndSort,
        update: function(e) {
            if(e === undefined || e.originalEvent === undefined || e.originalEvent.target === undefined) { return; }
            const $me = $(e.originalEvent.target).closest("li");
            const oldIdx = parseInt($me.attr("data-id"));
            const newIdx = $("#notesListData > li").index($me[0]);
            data.SwapDataItems(dbData.currentScreen, oldIdx, newIdx);
            DrawMain();
        }
    });
    $("#notesListData").disableSelection();

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
        if(dbData.dbList[dbData.currentScreen].type === "checklist") {
            ShowInputModal("newItem", "Add Item", "New Entry", "Add");
        } else {
            ShowNoteEditor(-1, false);
        }
    });

    // Note List
    $("#btnAddNotes").on("click", function() { ShowInputModal("newNotes", "Add Notes List", "New Notes List", "Create"); });
    $("#btnEditNote").on("click", function() {
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
        $("#bSettings, #bCredits, #bSearch, #backBtn").hide();
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
    $("#btnAddChecklist").on("click", function() { ShowInputModal("newChecklist", "Add Checklist", "New Checklist", "Create"); });
    $("#checkListData").on("click", "li", function(e) { ChecklistItemClick(e, $(this)); });
    $("#notesListData").on("click", "li", function(e) { NoteClick(e, $(this)); });
    $("#searchData").on("click", "li", function(e) {
        if($(this).hasClass("note")) {
            NoteClick(e, $(this));
        } else if($(this).hasClass("cbitem")) {
            ChecklistItemClick(e, $(this));
        }
    });
    $("#checkListData, #notesListData").on("click", ".ci-delete", function(e) {
        e.stopPropagation();
        const idx = parseInt($(this).closest(".settings").attr("data-id"));
        data.DeleteDataItem(dbData.currentScreen, idx);
        $(this).closest("li").remove();
        ctx.stateForBackButton = "home";
    });
    $("#checkListData").on("click", ".ci-rename", function(e) {
        e.stopPropagation();
        const idx = parseInt($(this).closest(".settings").attr("data-id"));
        const name = $(this).closest("li").find(".name").text();
        $(this).closest(".settings").remove();
        ShowInputModal("renameItem", `Rename <em>${name}</em>.`, "Entry Name", "Rename", idx);
        $("#txtModalInput").val(name).select();
    });
    $("#checkListData").on("click", ".ci-notes", function(e) {
        e.stopPropagation();
        const idx = parseInt($(this).closest(".settings").attr("data-id"));
        const notes = data.GetChecklistItemNotes(dbData.currentScreen, idx);
        const name = $(this).closest("li").find(".name").text();
        $(this).closest(".settings").remove();
        ShowInputModal("editNotes", `Notes for <em>${name}</em>.`, "Notes", "Save", idx);
        $("#txtModalInput").val(notes).select();
    });
    $("#checkListData, #notesListData").on("click", ".ci-important", function(e) {
        e.stopPropagation();
        const idx = parseInt($(this).closest(".settings").attr("data-id"));
        data.ToggleDataItemImportance(dbData.currentScreen, idx);
        DrawMain();
        $(this).closest("li").replaceWith(GetCheckboxItemHTML(dbData.dbList[dbData.currentScreen].data[idx], idx));
        ctx.stateForBackButton = "home";
    });
    $("#checkListData, #notesListData").on("click", ".ci-tags", function(e) {
        e.stopPropagation();
        const $parent = $(this).closest(".settings");
        const allTagsObj = dbData.dbList[dbData.currentScreen].tags;
        const allTags = Object.keys(allTagsObj).map(key => allTagsObj[key]);
        const idx = parseInt($parent.attr("data-id"));
        const myTags = dbData.dbList[dbData.currentScreen].data[idx].tags;
        SetSettingsTagSelectionHTML($(this), $parent, allTags, myTags);
    });
    $(document).on("click", ".tagList > .tag", function(e) {
        e.stopPropagation();
        const $parent = $(this).closest("li");
        const idx = parseInt($parent.attr("data-id"));
        const tagId = $(this).attr("data-id");
        data.ToggleTag(dbData.currentScreen, idx, tagId);
        if($(this).hasClass("active")) {
            $(`[data-id="${tagId}"`, $parent.find(".tagGroup")).remove();
        } else {
            const allTags = dbData.dbList[dbData.currentScreen].tags;
            $parent.find(".tagGroup").append(GetTagHTML(allTags, tagId));
        }
        $(this).toggleClass("active");
    });
    $("#checkListData, #notesListData").on("click", ".ci-move", function(e) {
        e.stopPropagation();
        const $parent = $(this).closest(".settings");
        const idx = parseInt($parent.attr("data-id"));
        ShowMoveModal(idx);
    });
    $("#notesListData").on("click", ".ci-edit", function(e) {
        e.stopPropagation();
        ShowNoteEditor(parseInt($(this).closest(".settings").attr("data-id")), false);
    });
    $(document).on("click", "#moveChecklists > li", function() {
        const listIdx = parseInt($(this).attr("data-id"));
        const elemIdx = parseInt($("#modalMove").attr("data-id"));
        data.MoveDataItem(dbData.currentScreen, listIdx, elemIdx);
        DrawMain();
        CloseModal("modalMove");
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
    if(targType === "i") { // button
        if($clicked.closest(".settings").length) { return; } // settings
        if($clicked.hasClass("goToResult")) { // Search
            const listIdx = $clicked.attr("data-parent");
            SelectDatalist.call($(`#sidebarData > li[data-id='${listIdx}']`));
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
    if(targType === "span" || targType === "li") { // text or main area
        $i.prop("checked", !$i.prop("checked"));
    } else if(targType === "i") { // button
        if($clicked.closest(".settings").length) { return; } // settings
        if($clicked.hasClass("goToResult")) { // Search
            const listIdx = $clicked.attr("data-parent");
            SelectDatalist.call($(`#sidebarData > li[data-id='${listIdx}']`));
            $(`#cbitem${idx} .edit`).click();
            document.documentElement.scrollTop = $(`#cbitem${idx}`).offset().top - 40;
        } else { // Edit
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
        case "noteEditor":
            const idx = parseInt($("#bNoteEditor").attr("data-id"));
            ShowNoteEditor(idx, true);
            break;
        case "noteReader":
            $("#backBtn").click();
            break;
        case "sidebar":
            HideSidebars();
            break;
        case "secondary":
            $("#backBtn").click();
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