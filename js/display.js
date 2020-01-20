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
function ShowEditTagModal(tagId) {
    $("#tagColorList > .tagColorSelector").removeClass("active");
    $("#tagIconList > .tagImgSelector").removeClass("active");
    if(typeof tagId !== "string") { // New Tag
        $("#modalTagEdit").attr("data-id", "");
        $("#modalTagEdit > div > .modalHeader").html("New Tag");
        $("#txtModalTagInput").val("");
        $(".tagColorSelector.tc0").addClass("active");
        $(".tagImgSelector.editorTagBox").addClass("active");
        $("#tagColorList").attr("data-selectedColor", 0);
        $("#tagColorList").attr("data-selectedImg", "");
        document.documentElement.style.setProperty("--current-tag-color", "#FF0000");
    } else { // Existing Tag
        $("#modalTagEdit").attr("data-id", tagId);
        const tag = dbData.dbList[dbData.currentScreen].tags[tagId];
        $("#modalTagEdit > div > .modalHeader").html(`Editing <em>${tag.tag}</em>`);
        $("#txtModalTagInput").val(tag.tag);
        const $colorTag = $(`.tagColorSelector.tc${tag.color}`);
        $colorTag.addClass("active");
        $(`.tagImgSelector[data-id="${tag.imgVal}"]`).addClass("active");
        $("#tagColorList").attr("data-selectedColor", tag.color);
        $("#tagColorList").attr("data-selectedImg", tag.imgVal);
        document.documentElement.style.setProperty("--current-tag-color", $colorTag.attr("data-color"));
    }
    ShowModal("modalTagEdit", false);
    $("#txtModalTagInput").focus();
}
function ShowTagEditor() {
    $(".body, #menuBtn, #menuRight").hide();
    $("#bTagEditor, #backBtn").show();
    HideSidebars();
    const currentList = dbData.dbList[dbData.currentScreen];
    $("#title").html(`Editing Tags for <em>${currentList.name}</em>`);
    ctx.stateForBackButton = "secondary";
    const tagHTMLs = [];
    const tagsSorted = Object.keys(currentList.tags).map(e => currentList.tags[e]).sort((a, b) => {
        if(a.sortOrder < b.sortOrder) { return -1; }
		if(a.sortOrder > b.sortOrder) { return 1; }
		return 0;
    });
    for(let i = 0; i < tagsSorted.length; i++) {
        tagHTMLs.push(GetTagEditHTML(tagsSorted[i]));
    }
    /*for(const id in currentList.tags) {
        const e = currentList.tags[id];
        tagHTMLs.push(GetTagEditHTML(e));
    }*/
    if(tagHTMLs.length === 0) {
        tagHTMLs.push(`<li class="no-items">This list does not have any tags yet. Tap the + icon in the bottom corner of the screen to add one.</li>`);
    } else {

    }
    $("#tagData").html(tagHTMLs.join(""));
}
function GetTagEditHTML(e) {
    let tagImg = "";
    if(e.imgVal === "") {
        tagImg = `<div class='modalTagColor tc${e.color}' data-color="${e.color}"></div>`;
    } else {
        tagImg = `<i class="material-icons tc${e.color}">${e.imgVal}</i>`;
    }
    return `<li class="tagEdit" data-id="${e.id}">
        <div class="tagImg">${tagImg}</div>
        <span>${e.tag.replace(/"/g, '\\"')}</span>
        <i class='editTag material-icons'>more_horiz</i>
        <i class="material-icons handle">unfold_more</i>
    </li>`;
}
function ShowMoveModal(elemIdx) {
    const currentList = dbData.dbList[dbData.currentScreen];
    const currentListType = currentList.type;
    const currentItem = currentList.data[elemIdx];
    $("#modalMove > div > .modalHeader > em").text(currentItem.name);
    $("#modalMove").attr("data-id", elemIdx);
    const html = dbData.dbList
                              .map((e, i) => [i, e.type, `<li data-id="${i}">${e.name}</li>`])
                              .filter(e => e[1] === currentListType && e[0] !== dbData.currentScreen)
                              .map(e => e[2]);
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
    switch(dbData.dbList[dbData.currentScreen].type) {
        case "checklist":
            $(".note-only").hide();
            $(".checklist-only").show();
            break;
        case "notes":
            $(".checklist-only").hide();
            $(".note-only").show();
            break;
    }
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
function DrawSidebar() {
    const $data = $("#sidebarData");
    $data.empty();
    const current = dbData.currentScreen;
    const html = dbData.dbList.map((e, i) => `<li data-id="${i}"${current === i ? ` class="active"` : ""}><i class="material-icons handle">unfold_more</i><span class="by-icon">${e.name}</span></li>`);
    $data.html(html.join(""));
}
function SelectDatalist() {
    const id = parseInt($(this).attr("data-id"));
    if(isNaN(id) || id >= dbData.dbList.length) { return; }
    HideSidebars();
    dbData.currentScreen = id;
    ctx.stateForBackButton = "home";
    $("#sidebarData > li.active").removeClass("active");
    $(this).addClass("active");
    ReturnToMain();
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
    $(".body, #menuBtn, #menuRight").hide();
    $("#bSettings, #backBtn").show();
    HideSidebars();
    $("#title").text("DataBee - Settings");
    ctx.stateForBackButton = "secondary";
}
function ShowCredits() {
    $(".body, #menuBtn, #menuRight").hide();
    $("#bCredits, #backBtn").show();
    HideSidebars();
    $("#title").text("DataBee v0JAN20");
    ctx.stateForBackButton = "secondary";
}
function ShowSearch() {
    $("#searchData").empty();
    $(".body, #menuBtn, #menuRight").hide();
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
        const html = results.map(e => {
            if(e.listType === "checklist") {
                return GetCheckboxItemHTML(e, e.myIdx, true);
            } else if(e.listType === "notes") {
                return GetNoteHTML(e, e.myIdx, true);
            } else { return ""; }
        });
        $("#searchData").html(html.join(""));
    }
}
function ShowNoteEditor(idx, readView) {
    const isNew = idx < 0;
    const elem = isNew ? {} : dbData.dbList[dbData.currentScreen].data[idx];
    const title = elem.title || "";
    const body = elem.body || "";
    $(".body, #menuBtn, #menuRight").hide();
    $("#bNoteEditor, #backBtn").show();
    $("#noteTitle").val(title);
    $("#noteBody").val(body);
    $("#noteTitleRead").html(BasicMarkdown(title));
    $("#noteBodyRead").html(BasicMarkdown(body));
    if(readView === true) {
        ctx.stateForBackButton = "noteReader";
        $("#noteEdit").hide();
        $("#noteRead").show();
        $("#title").text(`Viewing Note "${title}"`);
    } else {
        ctx.stateForBackButton = "noteEditor";
        $("#noteEdit").show();
        $("#noteRead").hide();
        if(isNew) {
            $("#title").text("Creating New Note");
        } else {
            $("#title").text(`Editing Note "${title}"`);
        }
        $("#noteBody").focus();
    }
    $("#bNoteEditor").attr("data-id", idx);
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
function ReturnToMain() {
    $(".body, #backBtn").hide();
    $("#bChecklist, #menuBtn, #menuRight").show();
    ctx.stateForBackButton = "home";
    DrawMain();
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
    const datalist = dbData.dbList[dbData.currentScreen];
    $("#checkListData, #notesListData").empty();
    $("#title").text(`${datalist.name}`);
    if(datalist.type === "checklist") {
        $("#checkListData").show();
        $("#notesListData").hide();
        const html = datalist.data.map((e, i) => GetCheckboxItemHTML(e, i));
        $("#checkListData").html(html.join(""));
    } else if(datalist.type === "notes") {
        $("#checkListData").hide();
        $("#notesListData").show();
        if(datalist.displayType === "tiles") {
            $("#notesListData").addClass("tileView");
        } else {
            $("#notesListData").removeClass("tileView");
        }
        const html = datalist.data.map((e, i) => GetNoteHTML(e, i));
        $("#notesListData").html(html.join(""));
    }
    SetScroller("prevScroller", dbData.currentScreen - 1);
    SetScroller("nextScroller", dbData.currentScreen + 1);
}
function SetScroller(elemId, idx) {
    const $elem = $(`#${elemId}`);
    if(idx < 0) { idx = dbData.dbList.length - 1; }
    else if(idx >= dbData.dbList.length) { idx = 0; }
    const list = dbData.dbList[idx];
    $elem.attr("data-idx", idx);
    $(".scrollerBtn_text", $elem).text(list.name);
}
function GetNoteHTML(e, i, isSearchQuery) {
    const dbListIdx = isSearchQuery === true ? e.ownerIdx : dbData.currentScreen;
    const allTags = dbData.dbList[dbListIdx].tags;
    const showHandle = isSearchQuery === true ? false : dbData.dbList[dbListIdx].sortType === "manual";
    const tagsHTML = GetTagsHTML(allTags, e.tags);
    const title = e.title === "" ? e.body.substring(0, 30) + (e.body.length > 30 ? "..." : "") : e.title;
    const body = e.title === "" ? "" : (e.body.length < 100 ? e.body : e.body.substring(0, 100) + "...");
    return `<li id="note${i}" data-id="${i}" class="note ui-sortable-handle${e.important ? " important" : ""}">
        <div class="note_title">
            ${e.important ? "<i class='important material-icons'>error_outline</i>" : ""}
            <div class="tagGroup">${tagsHTML}</div>
            ${BasicMarkdown(title)}
            ${showHandle ? `<i class="material-icons handle">unfold_more</i>` : ""}
            ${isSearchQuery === true ? `<i data-parent=${e.ownerIdx} class="goToResult material-icons">arrow_forward</i>` : ``}
            <i class="edit material-icons">more_horiz</i>
        </div>
        <div class="note_body">${BasicMarkdown(body)}</div>
        <div class="citem_cname">${FormatDate(e.date)}</div>
        ${isSearchQuery === true ? `<div class="citem_cname">${e.ownerName}</div>` : ``}
    </li>`;
}
function GetCheckboxItemHTML(e, i, isSearchQuery) {
    const dbListIdx = isSearchQuery === true ? e.ownerIdx : dbData.currentScreen;
    const allTags = dbData.dbList[dbListIdx].tags;
    const showHandle = isSearchQuery === true ? false : dbData.dbList[dbListIdx].sortType === "manual";
    const tagsHTML = GetTagsHTML(allTags, e.tags);
    return `<li id="cbitem${i}" data-id="${i}" class="cbitem ui-sortable-handle${e.important ? " important" : ""}">
        <input class="checkbox" type="checkbox"${e.checked ? " checked" : ""}>
        <span class="itemContainer">
            ${e.important ? "<i class='important material-icons'>error_outline</i>" : ""}
            <div class="tagGroup">${tagsHTML}</div>
            <span class="name">${e.val}</span>
        </span>
        ${showHandle ? `<i class="material-icons handle">unfold_more</i>` : ""}
        ${isSearchQuery === true ? `<i data-parent=${e.ownerIdx} class="goToResult material-icons">arrow_forward</i>` : ``}
        <i class="edit material-icons">more_horiz</i>
        ${e.notes !== "" ? `<div class="citem_notes">${e.notes}</div>` : ``}
        ${isSearchQuery === true ? `<div class="citem_cname">${e.ownerName}</div>` : ``}
        </li>`;
}
function GetTagsHTML(allTags, myTags) {
    const tags = myTags.map(t => allTags[t]).sort((a, b) => {
        if(a.sortOrder < b.sortOrder) { return -1; }
        if(a.sortOrder > b.sortOrder) { return 1; }
        return 0;
    });
    console.log(tags);
    return tags.map(t => GetTagHTML(t)).join("");
}
function GetTagHTML(tag) {
    if(tag.imgVal === "") {
        return `<div class="editorTagBox editorTagBoxSm tc${tag.color}" data-id="${tag.id}"></div>`;
    } else {
        return `<i class="material-icons dispTag tc${tag.color}" data-id="${tag.id}">${tag.imgVal}</i>`;
    }
}
function BasicMarkdown(s) {
    return s.replace(/\*\*(.*?)\*\*/g, `<strong>$1</strong>`)
            .replace(/__(.*?)__/g, `<strong>$1</strong>`)
            .replace(/\*(.*?)\*/g, `<em>$1</em>`)
            .replace(/_(.*?)_/g, `<em>$1</em>`)
            .replace(/~~(.*?)~~/g, `<span class="strikethru">$1</span>`)
            .replace(/((http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?)/g, `<a href="$1">$1</a>`);
}

function ToggleDataItemSettings($e, i, type) {
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
            `<div class="btn option ci-notes"><i class="material-icons">question_answer</i><div>Notes</div></div>`,
            `<div class="btn option ci-tags"><i class="material-icons">label</i><div>Tags</div></div>`,
            `<div class="btn option ci-important${important ? " active" : ""}"><i class="material-icons">error_outline</i><div>Important</div></div>`
        ];
        if(type === "notes") {
            settings.splice(3, 1); // remove NOTES
            settings.splice(1, 1); // remove RENAME
            settings.push(`<div class="btn option ci-edit"><i class="material-icons">edit</i><div>Edit</div></div>`);
        }
        if(dbData.settings.leftHanded) { settings.reverse(); }
        $e.append(`<div class="settings" data-id="${i}">${settings.join("")}</div>`);
    }
}

function SetSettingsTagSelectionHTML($tagButton, $settingsPanel, allTags, myTags) { // TODO
    if($tagButton.hasClass("active")) {
        $tagButton.removeClass("active");
        $settingsPanel.parent().find(".tagList").remove();
        if(dbData.dbList[dbData.currentScreen].sortType === "tag") {
            data.SortDataItems(dbData.currentScreen);
            DrawMain();
        }
    } else {
        $tagButton.addClass("active");
        if(allTags.length === 0) {
            $settingsPanel.after(`<div class="tagList noTags">This list does not have any tags for it. Go to the List Settings and select "Manage Tags" to add some.</div>`);
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
function FormatDate(dateNumber) {
    const d = new Date(dateNumber);
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "numeric", hour12: false }).format(d);
}