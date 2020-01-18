/* Modals */
function ShowModal(id, reset) {
    const $modal = $(`#${id}`);
    $modal.show();
    ctx.stateForBackButton = ctx.stateForBackButton + "|" + id;
    if(reset) { ResetElements($modal); }
}
function ShowInfoModal(type, title, body, buttonText) {
    $("#modalInfo").attr("data-type", type);
    $("#modalInfo > div > .modalHeader").html(title);
    $("#modalInfo > div > .modalContent").html(body);
    $("#btnConfirmModalInfo").text(buttonText || "OK");
    ShowModal("modalInfo", true);
}
function ShowInputModal(type, title, placeholder, buttonText, dataId) {
    $("#modalInput").attr("data-type", type);
    if(dataId !== undefined) {
        $("#modalInput").attr("data-id", dataId);
    }
    $("#modalInput > div > .modalHeader").html(title);
    $("#txtModalInput").attr("placeholder", placeholder);
    $("#txtModalInput").val("");
    $("#btnConfirmModalInput").text(buttonText);
    ShowModal("modalInput", true);
    $("#txtModalInput").focus(); 
}
function ShowAlert(title, body) {
    $("#modalAlert > div > .modalHeader").html(title);
    $("#modalAlert > div > .modalContent").html(body);
    ShowModal("modalAlert", true);
}
function ShowTagsModal() {
    const currentChecklist = dbData.dbList[dbData.currentScreen];
    $("#modalTags > div > .modalHeader > em").text(currentChecklist.name);
    const tagHTMLs = [];
    let i = 0;
    for(const id in currentChecklist.tags) {
        const e = currentChecklist.tags[id];
        tagHTMLs.push(GetTagModalHTML(e, i++));
    }
    $("#modalTagList").html(tagHTMLs.join(""));
    ctx.tagsToDelete = [];
    ShowModal("modalTags");
}
function GetTagModalHTML(e, i) {
    return `<li data-id="${e.id}">
        <div class='modalTagColor ${e.color}' data-color="${e.color}"></div>
        <input type="text" placeholder="Tag ${i}" value="${e.tag.replace(/"/g, '\\"')}">
        <i class='deleteTag material-icons'>delete</i>
    </li>`;
}
function ShowMoveModal(elemIdx) {
    const currentChecklist = dbData.dbList[dbData.currentScreen];
    const currentItem = currentChecklist.data[elemIdx];
    $("#modalMove > div > .modalHeader > em").text(currentItem.name);
    $("#modalMove").attr("data-id", elemIdx);
    const html = dbData.dbList.map((e, i) => `<li data-id="${i}">${e.name}</li>`);
    html.splice(dbData.currentScreen, 1);
    $("#moveChecklists").html(html.join(""));
    ShowModal("modalMove");
}

function ResetElements(elem) {
    elem.find("input").each(function() {
       $(this).val("");
       $(this).removeClass("comeOn"); 
    });
}
function CloseModal(id) {
    $(`#${id}`).hide();
    if(ctx.stateForBackButton.indexOf("|") > 0) {
        ctx.stateForBackButton = ctx.stateForBackButton.split("|")[0];
    }
}

function DrawAll() {
    if(dbData.settings.leftHanded) { $("body").addClass("lefty"); }
    else { $("body").removeClass("lefty"); }
    SetTheme();
    $("#front").hide();
    DrawSidebar();
    DrawMain();
    $(`#themes .box.theme${dbData.settings.theme}`).html(`<i class="material-icons">check</i>`);
}

/* Sidebar */
function ShowSidebar() {
    $("#sidebar").addClass("active");
    $("#rightbar").removeClass("active");
    $("#cover").show();
    ctx.stateForBackButton = "sidebar";
}
function ShowRightbar() {
    if(dbData.currentScreen < 0) { return; }
    $("#rightbar").addClass("active");
    $("#sidebar").removeClass("active");
    $("#cover").show();
    ctx.stateForBackButton = "sidebar";
}
function HideSidebars(e) {
    if(e !== undefined && (e.toElement.id === "menuBtn" || e.toElement.id === "menuRight")) { return; }
    $("#sidebar, #rightbar").removeClass("active");
    $("#sortTypes").hide().removeClass("active");
    $("#cover").hide();
    if($("#bSettings").is(":visible") || $("#bCredits").is(":visible")) {
        ctx.stateForBackButton = "secondary";
    } else {
        ctx.stateForBackButton = "home";
    }
}
function BodyHideSidebars(e) {
    if(e.toElement !== undefined && e.toElement.tagName.toLowerCase() === "html") {
        HideSidebars(e);
    }
}
function DrawSidebar() { // TODO: make me prettier
    const $data = $("#sidebarData");
    $data.empty();
    const current = dbData.currentScreen;
    const html = dbData.dbList.map((e, i) => `<li data-id="${i}"${current === i ? ` class="active"` : ""}><i class="material-icons handle">unfold_more</i><span class="by-icon">${e.name}</span></li>`);
    $data.html(html.join(""));
}
function SelectChecklist() {
    const id = parseInt($(this).attr("data-id"));
    if(isNaN(id) || id >= dbData.dbList.length) { return; }
    HideSidebars();
    $("#menuBtn, #menuRight").show();
    $("#backBtn").hide();
    dbData.currentScreen = id;
    ctx.stateForBackButton = "home";
    $("#sidebarData > li.active").removeClass("active");
    $(this).addClass("active");
    DrawMain();
    data.Save();
}
function ShowSettings() {
    for(const setting in dbData.settings) {
        const value = dbData.settings[setting];
        if(typeof value !== "boolean") { continue; }
        const $setting = $(`[data-setting="${setting}"]`);
        if($setting.length === 0) { continue; }
        $setting.attr("data-val", value).text(value ? "Enabled" : "Disabled");
        if(value) { $setting.addClass("button-primary"); }
    }
    $("#bChecklist, #bMain, #menuBtn, #menuRight, #bCredits, #bSearch").hide();
    $("#bSettings, #backBtn").show();
    HideSidebars();
    $("#title").text("DataBee - Settings");
    ctx.stateForBackButton = "secondary";
}
function ShowCredits() {
    $("#bChecklist, #bMain, #menuBtn, #menuRight, #bSettings, #bSearch").hide();
    $("#bCredits, #backBtn").show();
    HideSidebars();
    $("#title").text("DataBee - Credits");
    ctx.stateForBackButton = "secondary";
}
function ShowSearch() {
    $("#searchData").empty();
    $("#bChecklist, #bMain, #menuBtn, #menuRight, #bSettings, #bCredits").hide();
    $("#bSearch, #backBtn").show();
    HideSidebars();
    $("#title").text("DataBee - Search");
    $("#searchText").val("").focus();
    ctx.stateForBackButton = "secondary";
    DoSearch("");
}
function DoSearch(searchQuery) {
    $("#searchData").empty();
    if(searchQuery === "") {
        $("#searchData").html(`<li class="citem-text">Enter a search query above to begin searching.</li>`);
        return;
    }
    const results = data.SearchDataItems(searchQuery);
    if(results.length === 0) {
        $("#searchData").html(`<li class="citem-text">No results found.</li>`);
    } else {
        const html = results.map(e => GetCheckboxItemHTML(e, e.myIdx, true));
        $("#searchData").html(html.join(""));
    }
}

/* Main */
const themes = [
  {
    "--bg-color": "#000000",            "--text-color": "#B3B3B3",
    "--bg-color-important": "#660000",  "--text-color-brighter": "#DDDDDD",
    "--secondary-bg-color": "#FBFB07",  "--secondary-border-color": "#898937",
    "--header-bg-color": "#B3B3B3",     "--header-text-color": "#FFFFFF",
    "--button-text-color": "#4C4C4C"
  },
  {
    "--bg-color": "#FFFFFF",            "--text-color": "#191919",
    "--bg-color-important": "#88FFFF",  "--text-color-brighter": "#4C4C4C",
    "--secondary-bg-color": "#A0A0FF",  "--secondary-border-color": "#7070B2",
    "--header-bg-color": "#A0A0FF",     "--header-text-color": "#000000",
    "--button-text-color": "#000000"
  },
  {
    "--bg-color": "#FFCCCC",            "--text-color": "#191919",
    "--bg-color-important": "#FF8888",  "--text-color-brighter": "#4C4C4C",
    "--secondary-bg-color": "#AA0000",  "--secondary-border-color": "#5B0000",
    "--header-bg-color": "#AA0000",     "--header-text-color": "#FFFFFF",
    "--button-text-color": "#FFFFFF"
  }
];
function SetTheme() {
    const theme = themes[dbData.settings.theme || 0];
    const root = document.documentElement;
    for(const varName in theme) {
        root.style.setProperty(varName, theme[varName]);
    }
}
function DrawMain() {
    if(dbData.currentScreen === -1) {
        $("#title").text("DataBee - Welcome!");
        $(".body").hide();
        $("#bMain").show();
        return;
    } else if(dbData.currentScreen < 0 || dbData.currentScreen >= dbData.dbList.length) { return; }
    $(".body").hide();
    $("#bChecklist").show();
    $("#content").addClass("listView");
    const checklist = dbData.dbList[dbData.currentScreen];
    const $data = $("#checkListData");
    $data.empty();
    $("#title").text(`${checklist.name}`);
    const html = checklist.data.map((e, i) => GetCheckboxItemHTML(e, i));
    $data.html(html.join(""));
}
function GetCheckboxItemHTML(e, i, isSearchQuery) {
    const dbListIdx = isSearchQuery === true ? e.ownerIdx : dbData.currentScreen;
    const allTags = dbData.dbList[dbListIdx].tags;
    const showHandle = isSearchQuery === true ? false : dbData.dbList[dbListIdx].sortType === "manual";
    const tagsHTML = e.tags.map(tagId =>GetTagHTML(allTags, tagId)).join("");
    return `<li id="cbitem${i}" data-id="${i}" class="cbitem ui-sortable-handle${e.important ? " important" : ""}">
        <input class="checkbox" type="checkbox"${e.checked ? " checked" : ""}>
        <span class="itemContainer">
            ${e.important ? "<i class='important material-icons'>error_outline</i>" : ""}
            <div class="tagGroup">${tagsHTML}</div>
            <span class="name">${e.val}</span>
        </span>
        ${showHandle ? `<i class="material-icons handle">unfold_more</i>` : ""}
        <i class="edit material-icons">more_horiz</i>
        ${isSearchQuery === true ? `<i data-parent=${e.ownerIdx} class="goToResult material-icons">arrow_forward</i><div class="citem_cname">${e.ownerName}</div>` : ``}
        </li>`;
}
function GetTagHTML(allTags, tagId) { return `<div class="tagBox ${allTags[tagId].color}" data-id="${tagId}"></div>`; }

function ToggleCheckboxItemSettings($e, i) {
    const important = $e.hasClass("important");
    if($e.find(".settings").length) {
        $e.find(".settings").remove();
        $e.find(".tagList").remove();
        ctx.stateForBackButton = "home";
    } else {
        ctx.stateForBackButton = "checkboxSettings";
        const settings = [
            `<div class="btn option ci-delete"><i class="material-icons">delete</i><div>Delete</div></div>`,
            `<div class="btn option ci-rename"><i class="material-icons">edit</i><div>Rename</div></div>`,
            `<div class="btn option ci-move"><i class="material-icons">arrow_forward</i><div>Move</div></div>`,
            `<div class="btn option ci-tags"><i class="material-icons">label</i><div>Tags</div></div>`,
            `<div class="btn option ci-important${important ? " active" : ""}"><i class="material-icons">error_outline</i><div>Important</div></div>`
        ];
        if(dbData.settings.leftHanded) { settings.reverse(); }
        $e.append(`<div class="settings" data-id="${i}">${settings.join("")}</div>`);
    }
}

function SetSettingsTagSelectionHTML($tagButton, $settingsPanel, allTags, myTags) {
    if($tagButton.hasClass("active")) {
        $tagButton.removeClass("active");
        $settingsPanel.parent().find(".tagList").remove();
    } else {
        $tagButton.addClass("active");
        if(allTags.length === 0) {
            $settingsPanel.after(`<div class="tagList noTags">This checklist does not have any tags for it. Go to the Checklist Settings and select "Manage Tags" to add some.</div>`);
        } else {
            const tagHTML = allTags.map(e => `<div class="tag${myTags.indexOf(e.id) < 0 ? "" : " active"}" data-id="${e.id}">${e.tag}</div>`);
            $settingsPanel.after(`<div class="tagList">${tagHTML.join("")}</div>`);
        }
    }
}
function AddSortOrderImg($li, sortOrder) {
    $("#sortDirIcon").remove();
    if(sortOrder === "manual") { return; }
    $li.append(`<i id="sortDirIcon" class="material-icons">keyboard_arrow_${dbData.dbList[dbData.currentScreen].sortDir > 0 ? "up" : "down"}</i>`);
}