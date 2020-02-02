/* Data Sanitization */
function Sanitize(strs, ...vals) {
    const finishedStr = [];
    for(let i = 0; i < vals.length; i++) {
        finishedStr.push(strs[i]);
        const val = vals[i];
        if(typeof val === "number" || typeof val === "boolean") {
            finishedStr.push(val);
        } else {
            finishedStr.push(he.encode(val, { useNamedReferences: true }));
        }
    }
    finishedStr.push(strs[strs.length - 1]);
    return finishedStr.join("");
}
function SanitizeException(...exceptions) {
    return function(strs, ...vals) {
        const finishedStr = [];
        for(let i = 0; i < vals.length; i++) {
            finishedStr.push(strs[i]);
            const val = vals[i];
            if(exceptions.indexOf(i) >= 0) {
                finishedStr.push(val);
            } else if(typeof val === "number") {
                finishedStr.push(val);
            } else {
                finishedStr.push(he.encode(val, { useNamedReferences: true }));
            }
        }
        finishedStr.push(strs[strs.length - 1]);
        return finishedStr.join("");
    }
}

/* Modals */
function ShowModal(id, reset) {
    const $modal = $(Sanitize`#${id}`);
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
    if(title === "New Item") {
        $("#btnCancelModalInput").text("Done");
    } else {
        $("#btnCancelModalInput").text("Cancel");
    }
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
        const tag = CurList().tags[tagId];
        $("#modalTagEdit > div > .modalHeader").html(Sanitize`Editing <em>${tag.tag}</em>`);
        $("#txtModalTagInput").val(tag.tag);
        const $colorTag = $(Sanitize`.tagColorSelector.tc${tag.color}`);
        $colorTag.addClass("active");
        $(Sanitize`.tagImgSelector[data-id="${tag.imgVal}"]`).addClass("active");
        $("#tagColorList").attr("data-selectedColor", tag.color);
        $("#tagColorList").attr("data-selectedImg", tag.imgVal);
        document.documentElement.style.setProperty("--current-tag-color", $colorTag.attr("data-color"));
    }
    ShowModal("modalTagEdit", false);
    $("#txtModalTagInput").focus();
}
function ShowAdvancedAddModal() {
    $("#txtAdvName, #txtAdvNote").val("");
    const currlist = CurList();
    if(Object.keys(currlist.tags).length === 0) {
        $("#advTagsLabel").hide();
        $("#advTags").empty();
    } else {
        $("#advTagsLabel").show();
        $("#advTags").html(GetTogglingTagListHTML(currlist.tags, []));
    }
    ShowModal("modalAdvancedAdd");
    $("#txtAdvName").focus();
}
function ShowTagEditor() {
    $(".body, #menuBtn, #menuRight, #recipeTopBtns, #tagFilter").hide();
    $("#bTagEditor, #backBtn").show();
    HideSidebars();
    const currentList = CurList();
    $("#title").html(Sanitize`Editing Tags for <em>${currentList.name}</em>`);
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
    if(tagHTMLs.length === 0) {
        tagHTMLs.push(`<li class="no-items">This list does not have any tags yet. Tap the + icon in the bottom corner of the screen to add one.</li>`);
    }
    $("#tagData").html(tagHTMLs.join(""));
}
function GetTagEditHTML(e) {
    let tagImg = "";
    if(e.imgVal === "") {
        tagImg = Sanitize`<div class='modalTagColor tc${e.color}' data-color="${e.color}"></div>`;
    } else if(e.imgVal === "border_clear") {
        tagImg = Sanitize`<i class="material-icons hiddenTag">${e.imgVal}</i>`;
    } else {
        tagImg = Sanitize`<i class="material-icons tc${e.color}">${e.imgVal}</i>`;
    }
    return SanitizeException(1)`<li class="tagEdit" data-id="${e.id}">
        <div class="tagImg">${tagImg}</div>
        <span>${e.tag.replace(/"/g, '\\"')}</span>
        <i class='editTag material-icons'>more_horiz</i>
        <i class="material-icons handle">unfold_more</i>
    </li>`;
}
function ShowMoveModal(elemIdx) {
    const currentList = CurList();
    const currentListType = currentList.type;
    const currentItem = currentList.data[elemIdx];
    $("#modalMove > div > .modalHeader").html(Sanitize`Move <em>${currentItem.val}</em> to...`);
    $("#modalMove").attr("data-id", elemIdx);
    $("#modalMove").attr("data-type", "move");
    $("#groceryInfo").hide();
    const html = dbData.dbList
                              .map((e, i) => [i, e.type, Sanitize`<li data-id="${i}">${e.name}</li>`])
                              .filter(e => e[1] === currentListType && e[0] !== dbData.currentScreen)
                              .map(e => e[2]);
    $("#moveChecklists").html(html.join(""));
    ShowModal("modalMove");
}
function ShowGrocerySelectModal() {
    $("#modalMove > div > .modalHeader").html("Designate a Grocery List.");
    $("#modalMove").attr("data-id", "0");
    $("#modalMove").attr("data-type", "grocery");
    $("#groceryInfo").show();
    const html = dbData.dbList
                              .map((e, i) => [i, e.type, Sanitize`<li data-id="${i}">${e.name}</li>`])
                              .filter(e => e[1] === "checklist")
                              .map(e => e[2]);
    html.unshift(`<li data-id="-1"><em>None</em></li>`);
    $("#moveChecklists").html(html.join(""));
    ShowModal("modalMove");
}
function ShowTagFilterModal() {
    const currlist = CurList();
    $("#advTagFilters").html(GetTogglingTagListHTML(currlist.tags, currlist.tagFilters));
    $("#tagFilterType > button").removeClass("button-primary");
    if(currlist.tagFilterAnd) {
        $("#tagFilterType > button[data-val='true']").addClass("button-primary");
    } else {
        $("#tagFilterType > button[data-val='false']").addClass("button-primary");
    }
    ShowModal("modalTagFilter");
}
function ShowImportModal(type) {
    $("#modalFileImport").attr("data-type", type);
    $("#fileImportHeader").text(`Import ${type} File`);
    $("#txtImportURL").removeClass("comeOn").val("");
    ShowModal("modalFileImport");
}

function ResetElements(elem) {
    elem.find("input").each(function() {
       $(this).val("");
       $(this).removeClass("comeOn"); 
    });
}
function CloseModal(id) {
    $(Sanitize`#${id}`).hide();
    if(ctx.stateForBackButton.indexOf("|") > 0) {
        ctx.stateForBackButton = ctx.stateForBackButton.split("|")[0];
    }
}
function DrawAll() {
    if(dbData.settings.leftHanded) { $("body").addClass("lefty"); }
    else { $("body").removeClass("lefty"); }
    SetTheme();
    ReadyTheBees();
    $("#front").hide();
    DrawSidebar();
    DrawMain();
    $(Sanitize`#themes .box.theme${dbData.settings.theme}`).html(`<i class="material-icons">check</i>`);
}

/* Sidebar */
function ShowSidebar() {
    if(ctx.stateForBackButton.indexOf("recipe") === 0) { return; }
    $("#sidebar").addClass("active");
    $("#rightbar").removeClass("active");
    $("#cover").show();
    ctx.stateForBackButton = "sidebar";
}
function ShowRightbar() {
    if(ctx.stateForBackButton !== "home" || dbData.currentScreen < 0) { return; }
    switch(CurList().type) {
        case "checklist":
            $(".note-only, .recipe-only").hide();
            $(".checklist-only").show();
            break;
        case "notes":
            $(".checklist-only, .recipe-only").hide();
            $(".note-only").show();
            break;
        case "recipe":
            $(".checklist-only, .note-only").hide();
            $(".recipe-only").show();
            const gIdx = parseInt(CurList().groceryListIdx);
            if(!isNaN(gIdx) && gIdx >= 0) {
                const groceryList = dbData.dbList[gIdx];
                $("#groceryListName").text(groceryList.name);
            } else {
                $("#groceryListName").text("None");
            }
            break;
    }
    $(".settingToggled").hide();
    $("#rightbar").addClass("active");
    $("#sidebar").removeClass("active");
    $("#cover").show();
    ctx.stateForBackButton = "sidebar";
}
function HideSidebars(e) {
    if(e !== undefined && (e.target.id === "menuBtn" || e.target.id === "menuRight")) { return; }
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
    if(e.target !== undefined && e.target.tagName.toLowerCase() === "html") {
        HideSidebars(e);
    }
}
function DrawSidebar() {
    const $data = $("#sidebarData");
    $data.empty();
    const current = dbData.currentScreen;
    const html = dbData.dbList.map((e, i) => {
        let icon = "";
        switch(e.type) {
            case "checklist": icon = "check_box"; break;
            case "notes": icon = "notes"; break;
            case "recipe": icon = "kitchen"; break;
        }
        return Sanitize`
    <li data-id="${i}"${current === i ? ` class="active"` : ""}>
        <i class="material-icons handle">unfold_more</i>
        <i class="material-icons">${icon}</i>
        <span class="by-icon">${e.name}</span>
    </li>`});
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
        const $setting = $(Sanitize`[data-setting="${setting}"]`);
        if($setting.length === 0) { continue; }
        $setting.attr("data-val", value).text(value ? "Enabled" : "Disabled");
        if(value) { $setting.addClass("button-primary"); }
    }
    $(".body, #menuRight, #recipeTopBtns, #backBtn, #tagFilter").hide();
    $("#bSettings, #menuBtn").show();
    HideSidebars();
    $("#title").text("DataBee - Settings");
    ctx.stateForBackButton = "secondary";
}
function ShowCredits() {
    $(".body, #menuRight, #recipeTopBtns, #backBtn, #tagFilter").hide();
    $("#bCredits, #menuBtn").show();
    HideSidebars();
    $("#title").text("DataBee 0FEB01");
    ctx.stateForBackButton = "secondary";
}
function ShowHelp() {
    $(".body, #menuRight, #recipeTopBtns, #backBtn, #tagFilter").hide();
    $("#bHelp, #menuBtn").show();
    $("#content").removeClass("listView");
    HideSidebars();
    $("#title").text("DataBee - Help");
    ctx.stateForBackButton = "secondary";
}
function ShowSearch() {
    $("#searchData").empty();
    $(".body, #menuBtn, #menuRight, #recipeTopBtns, #tagFilter").hide();
    $("#bSearch, #backBtn").show();
    HideSidebars();
    $("#title").text("DataBee - Search");
    $("#searchText").show().val("").focus();
    ctx.stateForBackButton = "secondary";
    DoSearch("");
}
function ShowRecycleBin() {
    $("#searchData").empty();
    $(".body, #menuBtn, #menuRight, #recipeTopBtns, #tagFilter").hide();
    $("#bSearch, #backBtn").show();
    HideSidebars();
    $("#title").text("DataBee - Recycle Bin");
    $("#searchText").hide();
    ctx.stateForBackButton = "secondary";
    if(dbData.recycleBin.length === 0) {
        $("#searchData").html(`<li class="citem-text">Your Recycle Bin is empty right now. Up to 30 deleted items can stay in the Recycle Bin.</li>`);
    } else {
        const html = dbData.recycleBin.map((e, i) => {
            const list = dbData.dbList[e.ownerIdx];
            e.ownerName = list.name;
            if(list.type === "checklist") {
                return GetCheckboxItemHTML(e, i, list, "bin");
            } else if(list.type === "notes") {
                return GetNoteHTML(e, i, list, "bin");
            } else if(list.type === "recipe") {
                return GetRecipeHTML(e, i, list, "bin");
            } else { return ""; }
        });
        $("#searchData").html(html.join(""));
    }
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
        const html = results.map(re => {
            const e = re.elem;
            if(e.listType === "checklist") {
                return GetCheckboxItemHTML(e, e.myIdx, undefined, "search");
            } else if(e.listType === "notes") {
                return GetNoteHTML(e, e.myIdx, undefined, "search");
            } else if(e.listType === "recipe") {
                return GetRecipeHTML(e, e.myIdx, undefined, "search");
            } else { return ""; }
        });
        $("#searchData").html(html.join(""));
    }
}
function ShowNoteEditor(idx, readView) {
    const isNew = idx < 0;
    const elem = isNew ? {} : CurList().data[idx];
    const title = elem.title || "";
    const body = elem.body || "";
    $(".body, #menuBtn, #menuRight, #recipeTopBtns, #tagFilter").hide();
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
    "--header-bg-color": "#939393",     "--header-text-color": "#FFFFFF",
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
    $(".body, #backBtn, #recipeTopBtns").hide();
    $("#bChecklist, #menuBtn, #menuRight").show();
    ctx.stateForBackButton = "home";
    DrawMain();
}
function DrawMain() {
    if(dbData.currentScreen === -1) {
        $("#title").text("DataBee - Welcome!");
        $("#content").removeClass("listView");
        $(".body, #menuRight").hide();
        $("#bMain").show();
        return;
    } else if(dbData.currentScreen < 0 || dbData.currentScreen >= dbData.dbList.length) { return; }
    $(".body").hide();
    $("#bChecklist, #menuRight").show();
    $("#content").addClass("listView");
    const datalist = CurList();
    $("#listData").empty().attr("data-type", datalist.type).removeClass("tileView");
    $("#title").text(datalist.name);
    SetTagFilter();
    if(datalist.type === "checklist") {
        const html = datalist.data.map((e, i) => GetCheckboxItemHTML(e, i, datalist));
        $("#listData").html(html.join(""));
    } else if(datalist.type === "notes") {
        if(datalist.displayType === "tiles") { $("#listData").addClass("tileView"); }
        const isTileView =$("#listData").hasClass("tileView");
        const html = datalist.data.map((e, i) => GetNoteHTML(e, i, datalist));
        if(isTileView) {
            $("#listData").html(`
            <li class="tileCol"><ul class="tileColInner">${html.filter((e, i) => i % 2 === 0).join("")}</ul></li>
            <li class="tileCol"><ul class="tileColInner">${html.filter((e, i) => i % 2 !== 0).join("")}</ul></li>`);
        } else {
            $("#listData").html(html.join(""));
        }
    } else if(datalist.type === "recipe") {
        const html = datalist.data.map((e, i) => GetRecipeHTML(e, i, datalist));
        $("#listData").html(html.join(""));
    }
    SetScroller("prevScroller", dbData.currentScreen, -1);
    SetScroller("nextScroller", dbData.currentScreen, 1);
}
function SetScroller(elemId, currIdx, dir, origIdx) {
    origIdx = origIdx === undefined ? currIdx : origIdx;
    let idx = currIdx + dir;
    if(idx < 0) { idx = dbData.dbList.length - 1; }
    else if(idx >= dbData.dbList.length) { idx = 0; }
    const $elem = $(Sanitize`#${elemId}`);
    const list = dbData.dbList[idx];
    if(origIdx === idx) { // did a full loop; there are no scrollable lists!
        $(".scrollerBtn_text", $elem).text(list.name);
        $elem.attr("data-idx", idx);
        $("#checklistScroller").hide();
        return;
    } else if(!list.carousel) {
        SetScroller(elemId, idx, dir, origIdx);
    } else {
        $elem.attr("data-idx", idx);
        $(".scrollerBtn_text", $elem).text(list.name);
        $("#checklistScroller").show();
    }
}
function SetTagFilter() {
    const datalist = CurList();
    if(Object.keys(datalist.tags).length <= 1) {
        $("#tagFilter").hide();
        return;
    }
    $("#tagFilter").show();
    if(datalist.tagFilters.length === 0) {
        $("#tagFilter").html(`<i class="material-icons">label</i><span>No Filters</span><button class='tfButton applyTagFilters button-primary'>Apply Filters</button>`);
    } else {
        const tags = GetTagsHTML(datalist.tags, datalist.tagFilters, true);
        $("#tagFilter").html(`<i class="material-icons">label</i><span class="filterDisplay">Filters: ${tags}</span>
        <button class='tfButton applyTagFilters button-primary'>Edit</button><button class='tfButton clearTagFilters button'>Clear</button>`);
    }
}
// beeIMPORTANT, beeTAGS, beeHANDLE, beeSQ, beeSOWNER
// TODO: can probably merge a fair amount of these 3 GetThingHTML functions
function ReplaceCommonHTML(str, e, showHandle, extraType, tagsHTML) {
    let sq = "";
    if(extraType === "search") {
        sq = Sanitize`<i data-parent="${e.ownerIdx}" class="goToResult material-icons">arrow_forward</i>`;
    } else if(extraType === "bin") {
        sq = Sanitize`<i data-parent="${e.ownerIdx}" class="restoreItem material-icons">restore_from_trash</i>`;
    }
    return str.replace("{beeIMPORTANT}", e.important ? "<i class='important material-icons'>error_outline</i>" : "")
              .replace("{beeTAGS}", tagsHTML)
              .replace("{beeHANDLE}", showHandle ? `<i class="material-icons handle">unfold_more</i>` : "")
              .replace("{beeSOWNER}", extraType !== undefined ? Sanitize`<div class="citem_cname">${e.ownerName}</div>` : ``)
              .replace("{beeSQ}", sq)
              .replace("{beeEDIT}", extraType === "bin" ? "w" : `<i class="edit material-icons">more_horiz</i>`);
}
function GetRecipeHTML(e, i, parentList, extraType) {
    if(extraType === undefined && parentList.tagFilters.length > 0) {
        if(!IsTagMatch(parentList, e)) { return ""; }
    }
    const dbListIdx = extraType !== undefined ? e.ownerIdx : dbData.currentScreen;
    const allTags = dbData.dbList[dbListIdx].tags;
    const showHandle = extraType !== undefined ? false : dbData.dbList[dbListIdx].sortType === "manual";
    const tagsHTML = GetTagsHTML(allTags, e.tags);
    return ReplaceCommonHTML(Sanitize`<li id="recipeitem${i}" data-id="${i}" class="cbitem elem ritem ui-sortable-handle${e.important ? " important" : ""}">
        <span class="itemContainer">
            {beeIMPORTANT}
            <div class="tagGroup">{beeTAGS}</div>
            <span class="name">${e.name}</span>
        </span>
        {beeHANDLE}
        {beeSQ}
        {beeEDIT}
        <div class="addtlRecipeDetails">${e.author ? `by ${e.author}`: "{beeNBSP}"}{beeSOURCE}</div>
        <div class="addtlRecipeDetails">${e.notes.substring(0, 100) + (e.notes.length > 100 ? "..." : "")}</div>
        {beeSOWNER}
    </li>`, e, showHandle, extraType, tagsHTML).replace("{beeNBSP}", "&nbsp;").replace("{beeSOURCE}", e.source ? ` from ${
            e.source.indexOf("http") === 0 ? Sanitize`<a rel="noopener" target="_blank" href="${e.source}">${e.source.replace(/^(?:https?:\/\/)(?:www.)?([a-zA-Z0-9_\-.]+)\/.*$/g, "$1")}</a>` : Sanitize`${e.source}`
        }`: "");
}
function GetNoteHTML(e, i, parentList, extraType) {
    if(extraType === undefined && parentList.tagFilters.length > 0) {
        if(!IsTagMatch(parentList, e)) { return ""; }
    }
    const dbListIdx = extraType !== undefined ? e.ownerIdx : dbData.currentScreen;
    const allTags = dbData.dbList[dbListIdx].tags;
    const isTileView =$("#listData").hasClass("tileView");
    const showHandle = extraType !== undefined ? false : dbData.dbList[dbListIdx].sortType === "manual";
    const tagsHTML = GetTagsHTML(allTags, e.tags);
    const title = e.title === "" ? e.body.substring(0, 30) + (e.body.length > 30 ? "..." : "") : e.title;
    const body = e.title === "" ? "" : (e.body.length < 100 || isTileView ? e.body : e.body.substring(0, 100) + "...");
    if(e.locked) {
        return ReplaceCommonHTML(Sanitize`<li id="note${i}" data-id="${i}" class="locked elem note ui-sortable-handle${e.important ? " important" : ""}">
            <div class="note_title">
                {beeIMPORTANT}
                <div class="tagGroup">{beeTAGS}</div>
                {beeTITLE}
                {beeHANDLE}
                {beeSQ}
                {beeEDIT}
            </div>
            <div class="lock"><i class="material-icons lockedIcon">lock</i></div>
            <div class="citem_cname">${FormatDate(e.date)}</div>
            {beeSOWNER}
        </li>`, e, showHandle, extraType, tagsHTML).replace("{beeTITLE}", title.split(" ").map(e => e[0] + e.substring(1).replace(/./g, "*")).join(" "));
    } else {
        return ReplaceCommonHTML(Sanitize`<li id="note${i}" data-id="${i}" class="note elem ui-sortable-handle${e.important ? " important" : ""}">
            <div class="note_title">
                {beeIMPORTANT}
                <div class="tagGroup">{beeTAGS}</div>
                {beeTITLE}
                {beeHANDLE}
                {beeSQ}
                {beeEDIT}
            </div>
            <div class="note_body">{beeBODY}</div>
            <div class="citem_cname">${FormatDate(e.date)}</div>
            {beeSOWNER}
        </li>`, e, showHandle, extraType, tagsHTML).replace("{beeTITLE}", BasicMarkdown(title))
                                                    .replace("{beeBODY}", BasicMarkdown(body));
    }
}
function GetCheckboxItemHTML(e, i, parentList, extraType) {
    if(extraType === undefined && parentList.tagFilters.length > 0) {
        if(!IsTagMatch(parentList, e)) { return ""; }
    }
    if(e.divider === true) {
        if(parentList.sortType === "manual") {
            return Sanitize`<li id="cbitem${i}" data-id="${i}" class="cbitem divider"><span class="itemContainer"><i class="material-icons deleteDivider">delete</i></span><i class="material-icons handle">unfold_more</i></li>`;
        } else { return ""; }
    }
    const dbListIdx = extraType !== undefined ? e.ownerIdx : dbData.currentScreen;
    const allTags = dbData.dbList[dbListIdx].tags;
    const showHandle = extraType !== undefined ? false : dbData.dbList[dbListIdx].sortType === "manual";
    const tagsHTML = GetTagsHTML(allTags, e.tags);
    return ReplaceCommonHTML(Sanitize`<li id="cbitem${i}" data-id="${i}" class="cbitem elem ui-sortable-handle${e.important && e.checked === false ? " important" : ""}">
        <input class="checkbox" type="checkbox"${e.checked ? " checked" : ""}>
        <span class="itemContainer">
            {beeIMPORTANT}
            <div class="tagGroup">{beeTAGS}</div>
            <span class="name">${e.val}</span>
        </span>
        {beeHANDLE}
        {beeSQ}
        {beeEDIT}
        {beeNOTES}
        {beeSOWNER}
        </li>`, e, showHandle, extraType, tagsHTML).replace("{beeNOTES}", e.notes !== "" ? Sanitize`<div class="citem_notes">${e.notes}</div>` : ``);
}
function IsTagMatch(list, item) {
    const filters = list.tagFilters;
    if(list.tagFilterAnd) {
        return filters.every(f => item.tags.indexOf(f) >= 0);
    } else {
        return item.tags.some(tag => filters.indexOf(tag) >= 0);
    }
}
function GetTagsHTML(allTags, myTags, showHidden) {
    const tags = myTags.map(t => allTags[t]).sort((a, b) => {
        if(a.sortOrder < b.sortOrder) { return -1; }
        if(a.sortOrder > b.sortOrder) { return 1; }
        return 0;
    });
    return tags.map(t => GetTagHTML(t, showHidden)).join("");
}
function GetTagHTML(tag, showHidden) {
    if(tag.imgVal === "") {
        return Sanitize`<div class="editorTagBox editorTagBoxSm tc${tag.color}" data-id="${tag.id}"></div>`;
    } else if(tag.imgVal === "border_clear") {
        if(showHidden === true) {
            return Sanitize`<i class="material-icons dispTag hiddenTag" data-id="${tag.id}">${tag.imgVal}</i>`;
        } else {
            return "";
        }
    } else {
        return Sanitize`<i class="material-icons dispTag tc${tag.color}" data-id="${tag.id}">${tag.imgVal}</i>`;
    }
}
function BasicMarkdown(s) {
    return he.encode(s, { useNamedReferences: true }).replace(/\*\*(.*?)\*\*/g, `<strong>$1</strong>`)
            .replace(/__(.*?)__/g, `<strong>$1</strong>`)
            .replace(/\*(.*?)\*/g, `<em>$1</em>`)
            .replace(/_(.*?)_/g, `<em>$1</em>`)
            .replace(/~~(.*?)~~/g, `<span class="strikethru">$1</span>`)
            .replace(/((http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?)/g, `<a rel="noopener" target="blank" href="$1">$1</a>`);
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
            `<div class="btn option ci-rename"><i class="material-icons">edit</i><div>Edit</div></div>`,
            `<div class="btn option ci-move"><i class="material-icons">arrow_forward</i><div>Move</div></div>`,
            `<div class="btn option ci-notes"><i class="material-icons">question_answer</i><div>Notes</div></div>`,
            `<div class="btn option ci-tags"><i class="material-icons">label</i><div>Tags</div></div>`,
            `<div class="btn option ci-important${important ? " active" : ""}"><i class="material-icons">error_outline</i><div>Important</div></div>`
        ];
        if(type === "notes") {
            settings.splice(3, 1); // remove NOTES
            settings.splice(1, 1); // remove RENAME
            settings.push(`<div class="btn option ci-edit"><i class="material-icons">edit</i><div>Edit</div></div>`);
            if($e.hasClass("locked")) {
                settings.push(`<div class="btn option ci-lock"><i class="material-icons">lock_open</i><div>Show Info</div></div>`);
            } else {
                settings.push(`<div class="btn option ci-lock"><i class="material-icons">lock</i><div>Hide Info</div></div>`);
            }
        } else if(type === "recipe") {
            settings.splice(3, 1); // remove NOTES
            settings[1] = settings[1].replace("<div>Edit</div>", "<div>Rename</div>");
            settings.push(`<div class="btn option ci-export"><i class="material-icons">share</i><div>Export</div></div>`);
        }
        if(dbData.settings.leftHanded) { settings.reverse(); }
        $(".elem > .settings, .elem > .tagList").remove();
        $e.append(`<div class="settings" data-id="${i}">${settings.join("")}</div>`);
    }
}
function SetSettingsTagSelectionHTML($tagButton, $settingsPanel, allTags, myTags) {
    if($tagButton.hasClass("active")) {
        $tagButton.removeClass("active");
        $settingsPanel.parent().find(".tagList").remove();
        if(CurList().sortType === "tag") {
            data.SortDataItems(dbData.currentScreen);
            DrawMain();
        }
    } else {
        $tagButton.addClass("active");
        if(allTags.length === 0) {
            $settingsPanel.after(`<div class="tagList tagDisp noTags">This list does not have any tags for it. Go to the List Settings and select "Manage Tags" to add some.</div>`);
        } else {
            $settingsPanel.after(`<div class="tagList tagDisp">${GetTogglingTagListHTML(allTags, myTags)}</div>`);
        }
    }
}
function GetTogglingTagListHTML(allTags, myTags) {
    const tags = Object.keys(allTags).map(t => allTags[t]).sort((a, b) => {
        if(a.sortOrder < b.sortOrder) { return -1; }
        if(a.sortOrder > b.sortOrder) { return 1; }
        return 0;
    });
    const tagHTML = tags.map(tag => {
        let innerHTML = "";
        if(tag.imgVal === "") {
            innerHTML = Sanitize`<div class="editorTagBox editorTagBoxSm tc${tag.color}" data-id="${tag.id}"></div>`;
        } else if(tag.imgVal === "border_clear") {
            innerHTML = Sanitize`<i class="material-icons dispTag hiddenTag" data-id="${tag.id}">${tag.imgVal}</i>`;
        } else {
            innerHTML = Sanitize`<i class="material-icons dispTag tc${tag.color}" data-id="${tag.id}">${tag.imgVal}</i>`;
        }
        return SanitizeException(2)`<div class="tag${myTags.indexOf(tag.id) < 0 ? "" : " active"}" data-id="${tag.id}">${innerHTML}<div>${tag.tag}</div></div>`
    });
    return tagHTML.join("");
}
function AddSortOrderImg($li, sortOrder) {
    $("#sortDirIcon").remove();
    if(sortOrder === "manual") { return; }
    $li.append(`<i id="sortDirIcon" class="material-icons">keyboard_arrow_${CurList().sortDir > 0 ? "up" : "down"}</i>`);
}
function FormatDate(dateNumber) {
    const d = new Date(dateNumber);
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "numeric", hour12: false }).format(d);
}