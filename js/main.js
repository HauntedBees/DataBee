const db = new PouchDB("databee");
let stateForBackButton = "home";
$(function() {
    data.Load(DrawAll);
    window.oncontextmenu = function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

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
        $("#bSettings, #bCredits, #backBtn").hide();
        stateForBackButton = "home";
        DrawMain();
    });
    $(".settingsButton").on("click", function() {
        const newVal = $(this).attr("data-val") !== "true";
        data.ChangeSetting($(this).attr("data-setting"), newVal);
        if(newVal) {
            $(this).addClass("button-primary").text("Enabled");
        } else {
            $(this).removeClass("button-primary").text("Disabled");
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
                stateForBackButton = "sidebar";
                return;
        }
        CloseModal("modalInput");
        stateForBackButton = "home";
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
        stateForBackButton = "home";
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
    $(".btnCancel").on("click", function() { $(this).closest(".modal").hide(); });
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
        stateForBackButton = "home";
    });
    $("#checkListData").on("click", ".ci-rename", function() {
        const idx = parseInt($(this).closest(".settings").attr("data-id"));
        const name = $(this).closest("li").find(".name").text();
        $(this).closest(".settings").remove();
        ShowInputModal("renameItem", `Rename <em>${name}</em>.`, "Entry Name", "Rename", idx);
    });
    $("#checkListData").on("click", ".ci-important", function() {
        const idx = parseInt($(this).closest(".settings").attr("data-id"));
        data.ToggleDataItemImportance(dbData.currentScreen, idx);
        $(this).closest("li").replaceWith(GetCheckboxItemHTML(dbData.dbList[dbData.currentScreen].data[idx], idx));
        stateForBackButton = "home";
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
    if(stateForBackButton.indexOf("|") > 0) {
        const modalId = stateForBackButton.split("|")[1];
        CloseModal(modalId);
        return;
    }
    switch(stateForBackButton) {
        case "sidebar":
            HideSidebars();
            break;
        case "secondary":
            $("#backBtn").click();
            break;
        case "checkboxSettings":
            $(".settings").remove();
            stateForBackButton = "home";
            break;
        case "home":
            navigator.app.exitApp();
            break;
    }
}

// Swiping
let potentialSwitch = "", potentialX = 0;
function TouchPress(e) {
    const touch = e.originalEvent.touches[0];
    const max = window.screen.width;
    const current = touch.clientX;
    const diff = current / max;
    if(diff <= 0.3) {
        potentialSwitch = "left";
        potentialX = current;
    } else if(diff >= 0.7) {
        potentialSwitch = "right";
        potentialX = current;
    }
}
function TouchMove(e) {
    if(potentialSwitch === "") { return; }
    const touch = e.originalEvent.touches[0];
    const max = window.screen.width;
    const current = touch.clientX;
    const dx = current - potentialX;
    const dP = dx / max;
    if(potentialSwitch === "left" && dP > 0.1) {
        if(stateForBackButton === "sidebar") {
            HideSidebars();
        } else {
            ShowSidebar();
        }
        potentialSwitch = "";
    } else if(potentialSwitch === "right" && dP < -0.1) {
        if(stateForBackButton === "sidebar") {
            HideSidebars();
        } else {
            ShowRightbar();
        }
        potentialSwitch = "";
    }
}
function TouchRelease() {
    potentialSwitch = "";
}