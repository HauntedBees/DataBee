const db = new PouchDB("databee");
const ctx = {
    stateForBackButton: "home",
    tagsToDelete: []
};
$(function() {
    data.Load(DrawAll);
    window.oncontextmenu = function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    // Settings
    $(".box").on("click", function() { // TODO: selected box drops down
        const newTheme = parseInt($(this).attr("data-id"));
        $(`#themes .box.theme${dbData.settings.theme}`).html("");
        $(`#themes .box.theme${newTheme}`).html(`<i class="material-icons">check</i>`);
        dbData.settings.theme = newTheme;
        SetTheme();
        data.Save();
    });
    $("#backBtn").on("click", function() {
        $("#bChecklist, #menuBtn, #menuRight").show();
        $("#bSettings, #bCredits, #backBtn").hide();
        ctx.stateForBackButton = "home";
        DrawMain();
    });
    $(".settingsButton").on("click", function() {
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

    // Sidebar
    $("#menuBtn").on("click", ShowSidebar);
    $("#cover").on("click", HideSidebars);
    $("#sidebarData").on("click", "li", SelectChecklist);
    $("#btnSettings").on("click", ShowSettings);
    $("#btnCredits").on("click", ShowCredits);

    // Rightbar
    $("#menuRight").on("click", ShowRightbar);
    $("#renameChecklist").on("click", function() {
        ShowInputModal("renameChecklist", `Rename <em>${dbData.dbList[dbData.currentScreen].name}</em>.`, "New Checklist Name", "Rename");
    });
    $("#deleteChecklist").on("click", function() {
        ShowInfoModal("deleteChecklist", `Delete <em>${dbData.dbList[dbData.currentScreen].name}</em>.`, `Are you sure you want to delete the <em>${dbData.dbList[dbData.currentScreen].name}</em> checklist and all of its items? This cannot be undone.`, "Delete");
    });
    $("#btnConfirmModalInput").on("click", function() {
        const $txtBox = $("#txtModalInput");
        const val = $txtBox.val();
        if(val === "") {
            $txtBox.addClass("comeOn");
            return;
        }
        $txtBox.removeClass("comeOn");
        switch($("#modalInput").attr("data-type")) {
            case "renameChecklist":
                data.RenameData(dbData.currentScreen, val);
                $("#title").text(val);
                HideSidebars();
                break;
            case "renameItem":
                const idx = parseInt($("#modalInput").attr("data-id"));
                data.UpdateDataItem(dbData.currentScreen, idx, val);
                if(data.IsManualSorting()) { $(`#cbitem${idx} > span`).text(val); }
                break;
            case "newItem":
                const newItem = new ChecklistItem(val);
                const html = GetCheckboxItemHTML(newItem, dbData.dbList[dbData.currentScreen].data.length);
                $("#checkListData").append(html);
                data.AddDataItem(dbData.currentScreen, newItem);
                $txtBox.val("");
                $txtBox.focus();
                return;
            case "newChecklist":
                data.AddData(new Checklist(val));
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
                data.ClearCompletedDataItems(dbData.currentScreen);
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

    // Tags
    $("#manageTags").on("click", ShowTagsModal);
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
    
    // TODO: swap modal buttons for right/left hand?

    // Main
    document.addEventListener("backbutton", BackButtonPress, false);
    $("#checkListData").sortable({
        delay: 100,
        handle: ".handle", // TODO: VIBRATION?
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

    // Checklist
    $("#btnAddChecklist").on("click", function() { ShowInputModal("newChecklist", "Add Checklist", "New Checklist", "Create"); });
    $("#btnAddItemModal").on("click", function() { ShowInputModal("newItem", "Add Item", "New Entry", "Add"); });
    $("#checkListData").on("click", "li", function(e) { ChecklistItemClick(e, $(this)); });
    $("#checkListData").on("click", ".ci-delete", function() {
        const idx = parseInt($(this).closest(".settings").attr("data-id"));
        data.DeleteDataItem(dbData.currentScreen, idx);
        $(this).closest("li").remove();
        ctx.stateForBackButton = "home";
    });
    $("#checkListData").on("click", ".ci-rename", function() {
        const idx = parseInt($(this).closest(".settings").attr("data-id"));
        const name = $(this).closest("li").find(".name").text();
        $(this).closest(".settings").remove();
        ShowInputModal("renameItem", `Rename <em>${name}</em>.`, "Entry Name", "Rename", idx);
        $("#txtModalInput").val(name).select();
    });
    $("#checkListData").on("click", ".ci-important", function() {
        const idx = parseInt($(this).closest(".settings").attr("data-id"));
        data.ToggleDataItemImportance(dbData.currentScreen, idx);
        $(this).closest("li").replaceWith(GetCheckboxItemHTML(dbData.dbList[dbData.currentScreen].data[idx], idx));
        ctx.stateForBackButton = "home";
    });
    $("#checkListData").on("click", ".ci-tags", function() {
        const $parent = $(this).closest(".settings");
        const allTagsObj = dbData.dbList[dbData.currentScreen].tags;
        const allTags = Object.keys(allTagsObj).map(key => allTagsObj[key]);
        const idx = parseInt($parent.attr("data-id"));
        const myTags = dbData.dbList[dbData.currentScreen].data[idx].tags;
        SetSettingsTagSelectionHTML($(this), $parent, allTags, myTags);
    });
    $(document).on("click", ".tagList > .tag", function() {
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

    // Swipe Handlers
    $(document).on("touchstart", TouchPress);
    $(document).on("touchmove", TouchMove);
    $(document).on("touchend", TouchRelease);
});
function ChecklistItemClick(e, $t) {
    const targType = e.target.tagName.toLowerCase();
    const $i = $t.find("input");
    const idx = parseInt($t.attr("data-id"));
    if(targType === "span" || targType === "li") { // text or main area
        $i.prop("checked", !$i.prop("checked"));
    } else if(targType === "i") { // button
        if($(e.target).closest(".settings").length) { return; } // settings
        ToggleCheckboxItemSettings($t, idx);
        return;
    } else if(targType !== "input") { // settings
        return;
    } // otherwise it's the checkbox
    data.UpdateDataItem(dbData.currentScreen, idx, undefined, $i.prop("checked"));
    if(dbData.settings.moveDownOnCheck || dbData.settings.moveUpOnUncheck) {
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
function TouchPress(e) {
    if(ctx.stateForBackButton === "secondary" || ctx.stateForBackButton.indexOf("|") >= 0) { return; }
    const touch = e.originalEvent.touches[0];
    potentialSwitch = true;
    potentialX = touch.clientX;
}
function TouchMove(e) {
    if(!potentialSwitch) { return; }
    const touch = e.originalEvent.touches[0];
    const max = window.screen.width;
    const current = touch.clientX;
    const dx = current - potentialX;
    const dP = dx / max;
    if(dP > 0.1) {
        if(ctx.stateForBackButton === "sidebar") {
            HideSidebars();
        } else {
            ShowSidebar();
        }
        potentialSwitch = false;
    } else if(dP < -0.1) {
        if(ctx.stateForBackButton === "sidebar") {
            HideSidebars();
        } else {
            ShowRightbar();
        }
        potentialSwitch = false;
    }
}
function TouchRelease() {
    potentialSwitch = false;
}