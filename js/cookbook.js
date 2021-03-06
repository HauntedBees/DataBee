function SetUpCookbook() {
    $("#btnAddRecipe").on("click", function() { ShowInputModal("newCookbook", "New Cookbook", "New Cookbook", "Create"); });
    $("#btnAddIngredient").on("click", function() {
        ShowModal("modalAddIngredient", true);
        $("#btnConfirmIngredient").text("Add");
        $("#modalAddIngredient > div > .modalHeader").text("Add Ingredient");
        $("#modalAddIngredient").attr("data-id", "");
        $("#ddlModalUnit").val("");
        $("#txtModalIngredient").focus();
    });
    $("#btnConfirmIngredient").on("click", function() {
        $("#modalAddIngredient .comeOn").removeClass("comeOn");
        const ing = $("#txtModalIngredient").val();
        if(ing === "") {
            $("#txtModalIngredient").addClass("comeOn");
            return;
        }
        const unit = $("#ddlModalUnit").val();
        const amt = $("#txtModalAmount").val();
        if(unit !== "toTaste" && unit !== "none") {
            if(amt === "") {
                $("#txtModalAmount").addClass("comeOn");
                return;
            } else if(!IsValidNumberString(amt)) {
                $("#txtModalAmount").addClass("comeOn").val("Integer, decimal, or fraction.").focus().select();
                return;
            }
        }
        const ingredient = new Ingredient(ing, amt, unit, $("#txtIngGroup").val());

        const ingId = $("#modalAddIngredient").attr("data-id");
        const recipeIdx = parseInt($("#bRecipeEditor").attr("data-id"));
        if(ingId === "") { // new
            data.AddRecipeIngredient(dbData.currentScreen, recipeIdx, ingredient);
        } else { // edit
            data.ReplaceRecipeIngredient(dbData.currentScreen, recipeIdx, parseInt(ingId), ingredient);
        }
        EditRecipe(recipeIdx);
        CloseModal("modalAddIngredient");
    });
    $("#ingredientEditList").on("click", ".recipeDel", function() {
        const ingId = parseInt($(this).parent().attr("data-id"));
        const recipeIdx = parseInt($("#bRecipeEditor").attr("data-id"));
        data.RemoveRecipeIngredient(dbData.currentScreen, recipeIdx, ingId);
        EditRecipe(recipeIdx);
    });
    $("#ingredientEditList").on("click", ".recipeEdit", function() {
        $("#modalAddIngredient > div > .modalHeader").text("Edit Ingredient");
        $("#btnConfirmIngredient").text("Save");
        const ingId = parseInt($(this).parent().attr("data-id"));
        const recipeIdx = parseInt($("#bRecipeEditor").attr("data-id"));
        const ingredient = CurList().data[recipeIdx].ingredience[ingId];
        ShowModal("modalAddIngredient", true);
        $("#modalAddIngredient").attr("data-id", ingId);
        $("#txtModalIngredient").val(ingredient.ingredient);
        if(ingredient.range === undefined) {
            $("#txtModalAmount").val(ingredient.amount);
        } else {
            $("#txtModalAmount").val(`${ingredient.amount} - ${ingredient.range}`);
        }
        $("#ddlModalUnit").val(ingredient.unit);
        $("#txtIngGroup").val(ingredient.group);
    });
    $(".servingSizeAdjustment").on("click", function() {
        const dir = $(this).attr("data-dir") === "1" ? 1 : -1;
        const currentVal = $("#currentServingSize").val();
        const recipeIdx = parseInt($("#bRecipeEditor").attr("data-id"));
        const recipe = CurList().data[recipeIdx];
        if(!IsValidNumberString(currentVal)) {
            $("#currentServingSize").addClass("comeOn");
            $("#currentServingSize").val(recipe.servings);
            CalibrateIngredientAmounts(recipe, StringToNumber(`${recipe.servings}`));
            return;
        }
        let actualVal = StringToNumber(currentVal);
        if(dir > 0) {
            if(actualVal.fraction.d === 1) {
                actualVal.fraction = actualVal.fraction.add(1);
            } else {
                actualVal.fraction = actualVal.fraction.ceil();
            }
        } else {
            if(actualVal.fraction.equals(1)) {
                actualVal.fraction = new Fraction("1/2");
            } else if(actualVal.fraction.compare(1) < 0) {
                actualVal.fraction = new Fraction("1/4");
            } else if(actualVal.fraction.d === 1) {
                actualVal.fraction = actualVal.fraction.add(-1);
            } else {
                actualVal.fraction = actualVal.fraction.floor();
            }
        }
        CalibrateIngredientAmounts(recipe, actualVal);
    });
    $("#currentServingSize").on("blur", function() {
        const currentVal = $("#currentServingSize").val();
        let actualValue = {};
        if(IsValidNumberString(currentVal)) {
            actualValue = StringToNumber(currentVal);
        } else {
            actualValue = StringToNumber("0");
        }
        const recipeIdx = parseInt($("#bRecipeEditor").attr("data-id"));
        const recipe = CurList().data[recipeIdx];
        if(actualValue.fraction.compare(0) > 0) {
            CalibrateIngredientAmounts(recipe, actualValue);
        } else {
            $("#currentServingSize").addClass("comeOn");
            $("#currentServingSize").val(recipe.servings);
            CalibrateIngredientAmounts(recipe, StringToNumber(`${recipe.servings}`));
        }
    });
    $("#recipeViewEdit").on("click", function() {
        const recipeIdx = parseInt($("#bRecipeEditor").attr("data-id"));
        EditRecipe(recipeIdx);
    });
    $("#recipeViewClear").on("click", function() {
        const recipeIdx = parseInt($("#bRecipeEditor").attr("data-id"));
        data.ClearRecipeStepChecks(dbData.currentScreen, recipeIdx);
        $(".viewStep").removeClass("checked");
        $(".recipeStep").prop("checked", "");
    });

    $("#btnRecipeFull").on("click", function() {
        $("#recipeHeader > div").removeClass("active");
        $("#btnRecipeFull").addClass("active");
        $("#recipeRead > *, #recipeEdit > *").removeClass("full").show();
    });
    $("#btnRecipeIngr").on("click", function() {
        $("#recipeHeader > div").removeClass("active");
        $("#btnRecipeIngr").addClass("active");
        $("#recipeRead > *").removeClass("full").hide();
        $("#recipeRead > *, #recipeEdit > *").removeClass("full").hide();
        $(".showIng").addClass("full").show();
    });
    $("#btnRecipeSteps").on("click", function() {
        $("#recipeHeader > div").removeClass("active");
        $("#btnRecipeSteps").addClass("active");
        $("#recipeRead > *, #recipeEdit > *").removeClass("full").hide();
        $(".showStep").addClass("full").show();
    });


    $("#btnAddStep").on("click", function() {
        ShowModal("modalAddStep", true);
        $("#btnConfirmStep").text("Add");
        $("#modalAddStep > div > .modalHeader").text("Add Step");
        $("#modalAddStep").attr("data-id", "");
        $("#txtStep").val("").focus();
    });
    $("#btnConfirmStep").on("click", function() {
        $("#txtStep").removeClass("comeOn");
        const stepText = $("#txtStep").val();
        if(stepText === "") {
            $("#txtStep").addClass("comeOn");
            return;
        }
        const step = new Step(stepText);
        const stepId = $("#modalAddStep").attr("data-id");
        const recipeIdx = parseInt($("#bRecipeEditor").attr("data-id"));
        if(stepId === "") { // new
            data.AddRecipeStep(dbData.currentScreen, recipeIdx, step);
        } else { // edit
            data.ReplaceRecipeStep(dbData.currentScreen, recipeIdx, parseInt(stepId), step);
        }
        EditRecipe(recipeIdx);
        CloseModal("modalAddStep");
    });
    $("#stepEditList").on("click", ".recipeDel", function() {
        const stepId = parseInt($(this).parent().attr("data-id"));
        const recipeIdx = parseInt($("#bRecipeEditor").attr("data-id"));
        data.RemoveRecipeStep(dbData.currentScreen, recipeIdx, stepId);
        EditRecipe(recipeIdx);
    });
    $("#stepEditList").on("click", ".recipeEdit", function() {
        $("#modalAddStep > div > .modalHeader").text("Edit Step");
        $("#btnConfirmStep").text("Save");
        const stepId = parseInt($(this).parent().attr("data-id"));
        const recipeIdx = parseInt($("#bRecipeEditor").attr("data-id"));
        const step = CurList().data[recipeIdx].steps[stepId];
        ShowModal("modalAddStep", true);
        $("#modalAddStep").attr("data-id", stepId);
        $("#txtStep").val(step.step);
    });

    $("#recipeServingSize").on("blur", function() {
        const recipeIdx = parseInt($("#bRecipeEditor").attr("data-id"));
        const recipe = CurList().data[recipeIdx];
        const newServings = $(this).val();
        if(IsValidNumberString(newServings)) {
            recipe.servings = newServings;
            data.Save();
        } else {
            $(this).val(recipe.servings);
        }
    });
    $(".rMetadata").on("blur", function() {
        const recipeIdx = parseInt($("#bRecipeEditor").attr("data-id"));
        const recipe = CurList().data[recipeIdx];
        const value = $(this).val();
        const type = $(this).attr("data-val");
        recipe[type] = value;
        data.Save();
    });

    $("#stepViewList").on("click", ".recipeStep", function() {
        const $parent = $(this).closest("li");
        const listItemIdx = parseInt($parent.attr("data-id"));
        data.ToggleRecipeStepCheck(dbData.currentScreen, 
                                    parseInt($("#bRecipeEditor").attr("data-id")),
                                    listItemIdx);
        $parent.toggleClass("checked");
    });
    
    $("#manageGroceryList").on("click", function() { ShowGrocerySelectModal(); });
    $("#ingredientViewList").on("click", ".addToCart", function() {
        if($(this).hasClass("alreadyAdded")) { return; }
        const myGroceryList = parseInt($(this).attr("data-grocery"));
        if(isNaN(myGroceryList)) { return; }

        const recipeIdx = parseInt($("#bRecipeEditor").attr("data-id"));
        if(isNaN(recipeIdx)) { return; }
        const recipe = CurList().data[recipeIdx];
        
        const $listItem = $(this).parent();
        const ingredientIdx = parseInt($listItem.attr("data-id"));
        if(isNaN(ingredientIdx)) { return; }
        const ingredient = recipe.ingredience[ingredientIdx];

        const item = new ChecklistItem(ingredient.ingredient);
        const unitInfo = $listItem.find(".unitInfo").text();
        item.notes = unitInfo;

        data.AddDataItem(myGroceryList, item);
        $(this).addClass("alreadyAdded");
    });

    $(document).on("click", ".step-unit", function() {
        const unit = $(this).attr("data-unit");
        const rawunit = $(this).attr("data-rawunit");
        const amount = new Fraction($(this).attr("data-amount"));
        const range = $(this).attr("data-range");
        const rangeFrac = (range === undefined || range === "") ? undefined : new Fraction(range);
        const newAmount = ConvertBetweenMetricAndImperial(unit, amount, rawunit, rangeFrac);
        $(this).replaceWith(GetAdjustableIngredientHTML(newAmount.amount, newAmount.unit, $(this).attr("data-tilde"), true, rawunit, newAmount.range));
    });

    $("#listData").on("click", ".ci-export", function(e) {
        e.stopPropagation();
        const idx = parseInt($(this).closest(".settings").attr("data-id"));
        const item = CurList().data[idx];
        const b = new Blob([JSON.stringify(item, null, 2)], { type: "application/json" });
        if(typeof cordova !== "undefined") {
            window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory + "Download", function(entry) {
                entry.getFile(`databee_recipe_${item.name}.json`, { create: true, exclusive: false }, function(file) {
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
            a.download = `databee_recipe_${item.name}.json`;
            a.dispatchEvent(new MouseEvent("click"));
        }
    });
    $("#importRecipe").on("click", function() { ShowImportModal("Recipe"); });

    $("#ingredientGroups").sortable({
        delay: 100,
        handle: ".handle",
        start: StartSort, stop: EndSort,
        update: function(e) {
            if(e === undefined || e.originalEvent === undefined || e.originalEvent.target === undefined) { return; }
            const $me = $(e.originalEvent.target).closest("li");
            const recipeIdx = parseInt($("#bRecipeEditor").attr("data-id"));
            const list = CurList().data[recipeIdx].groupSortOrder;
            const oldIdx = parseInt($me.attr("data-id"));
            const newIdx = $("#ingredientGroups > li").index($me[0]);
            const elem = list[oldIdx];
            list.splice(oldIdx, 1);
            list.splice(newIdx, 0, elem);
            data.Save();
        }
    });
}

// Display
function ViewRecipe(idx) {
    const recipe = CurList().data[idx];
    $(".body, #menuBtn, #menuRight, #recipeEdit, #tagFilter").hide();
    $("#bRecipeEditor, #backBtn, #recipeRead, #recipeTopBtns").show();
    $("#title").text(recipe.name);
    ctx.stateForBackButton = "recipeviewer";
    $("#bRecipeEditor").attr("data-id", idx);
    $("#currentServingSize").val(recipe.servings);
    if(recipe.author) {
        $("#recipeBy").show();
        if(recipe.source) {
            if(recipe.source.indexOf("http") === 0) {
                $("#recipeBy").html(Sanitize`Recipe by: <a rel="noopener" target="_blank" href="${recipe.source}">${recipe.author}</a>`);
            } else {
                $("#recipeBy").html(Sanitize`Recipe by: ${recipe.author}, ${recipe.source}`);
            }
        } else {
            $("#recipeBy").html(Sanitize`Recipe by: ${recipe.author}`);
        }
    } else if(recipe.source) {
        if(recipe.source.indexOf("http") === 0) {
            $("#recipeBy").html(Sanitize`Recipe from: <a rel="noopener" target="_blank" href="${recipe.source}">${recipe.source.replace(/^(?:https?:\/\/)(?:www.)?([a-zA-Z0-9_\-.]+)\/.*$/g, "$1")}</a>`);
        } else {
            $("#recipeBy").html(Sanitize`Recipe from: ${recipe.source}`);
        }
    } else {
        $("#recipeBy").hide();
    }
    if(recipe.notes) {
        $("#recipeNotes").html(Sanitize`<strong>Notes:</strong> ${recipe.notes}`).show();
    } else {
        $("#recipeNotes").hide();
    }
    const recipeTimeHTML = [];
    if(recipe.prepTime) { recipeTimeHTML.push(Sanitize`<div class="timeInfo"><span>Prep Time</span><span>${recipe.prepTime}</span></div>`); }
    if(recipe.cookTime) { recipeTimeHTML.push(Sanitize`<div class="timeInfo"><span>Cook Time</span><span>${recipe.cookTime}</span></div>`); }
    if(recipe.totalTime) { recipeTimeHTML.push(Sanitize`<div class="timeInfo"><span>Total Time</span><span>${recipe.totalTime}</span></div>`); }
    $("#recipeTimeInfo").html(recipeTimeHTML.join(""));
    $("#recipeHeader > div").removeClass("active");
    $("#btnRecipeFull").addClass("active").click();
    DrawRecipe(recipe, StringToNumber(`${recipe.servings}`));
}
function DrawRecipe(recipe, servingsObj) {
    const groceryListIdx = parseInt(CurList().groceryListIdx);
    const groceryListHTML = (isNaN(groceryListIdx) || groceryListIdx < 0) ? "" : `<i data-grocery="${groceryListIdx}" class="material-icons addToCart">shopping_cart</i>`;
    if(recipe.groupSortOrder !== undefined && recipe.groupSortOrder.length > 0) {
        recipe.ingredience.sort((a, b) => recipe.groupSortOrder.indexOf(a.group) - recipe.groupSortOrder.indexOf(b.group));
    } else {
        recipe.ingredience.sort((a, b) => a.group.localeCompare(b.group));
    }
    $("#ingredientViewList").html(recipe.ingredience.map((e, i) => {
        const lastGroup = (i === 0 ? "" : recipe.ingredience[i - 1].group);
        const categoryPrefix = (lastGroup !== e.group) ? Sanitize`<li class="ingredientHeader">${e.group || "No Group"}</li>` : "";
        if(e.unit === "toTaste") { return SanitizeException(0, 3)`${categoryPrefix}<li data-id="${i}" class="viewIngredient">${e.ingredient}, to taste ${groceryListHTML}</li>`; }
        const adjustedRecipe = GetServingSizeAdjustedIngredient(e, recipe.servings, servingsObj);
        const hasTilde = adjustedRecipe.amount[0] === "~";
        if(hasTilde) { adjustedRecipe.amount = adjustedRecipe.amount.substring(1); }
        if(typeof adjustedRecipe.fraction === "object") { 
            adjustedRecipe.fraction = new Fraction(adjustedRecipe.fraction);
        } else if(typeof adjustedRecipe.fraction !== "undefined") {
            adjustedRecipe.fraction = new Fraction(adjustedRecipe.fraction.replace("~", "") || 0);
        }
        const amt = adjustedRecipe.fraction === undefined ? new Fraction(adjustedRecipe.amount || 0) : adjustedRecipe.fraction;
        return SanitizeException(0, 2, 4)`${categoryPrefix}<li data-id="${i}" class="viewIngredient">
            ${GetAdjustableIngredientHTML(amt, adjustedRecipe.unit, hasTilde ? "~" : "", adjustedRecipe.unit !== "", e.unit, adjustedRecipe.range)} ${adjustedRecipe.ingredient}
            ${groceryListHTML}
        </li>`}).join(""));
    $("#stepViewList").html(recipe.steps.map((e, i) => SanitizeException(4)`
    <li data-id="${i}" class="viewStep ${e.checked?"checked":""}">
        <span><input class="recipeStep checkbox" ${e.checked?"checked=checked":""} type="checkbox"> ${i + 1}. ${AdjustStep(e.step, recipe.servings, servingsObj)}</span>
    </li>`).join(""));
}
function EditRecipe(idx) {
    const recipe = CurList().data[idx];
    $(".body, #menuBtn, #menuRight, #recipeRead, #recipeTopBtns, #tagFilter").hide();
    $("#bRecipeEditor, #backBtn, #recipeEdit").show();
    $("#title").text(recipe.name);
    ctx.stateForBackButton = "recipeeditor";
    $("#bRecipeEditor").attr("data-id", idx);
    $("#recipeServingSize").val(recipe.servings);
    $(".rMetadata").each(function(i, e) {
        const $e = $(e);
        $e.val(recipe[$e.attr("data-val")]);
    });
    $("#ingredientEditList").html(recipe.ingredience.map((e, i) => SanitizeException(1)`
    <li data-id="${i}" class="editIngredient">
        ${(e.unit === "toTaste" || e.unit === "none")
            ? Sanitize`<span>${e.ingredient}${e.unit === "toTaste" ? ", to taste" : ""}</span>`
            : Sanitize`<span>${e.amount}${e.range === undefined ? "" : ` - ${e.range}`}${GetUnitDisplay(e.unit, e.amount)} ${e.ingredient}</span>`}
        <i class="material-icons recipeEditBtn recipeEdit">edit</i>
        <i class="material-icons recipeEditBtn recipeDel">delete</i>
    </li>`).join(""));
    $("#stepEditList").html(recipe.steps.map((e, i) => Sanitize`
    <li data-id="${i}" class="editStep">
        <span>${i + 1}. ${e.step}</span>
        <i class="material-icons recipeEditBtn recipeEdit">edit</i>
        <i class="material-icons recipeEditBtn recipeDel">delete</i>
    </li>`).join(""));
    let ingredientGroups = [...new Set(recipe.ingredience.map(e => e.group))];
    if(ingredientGroups.length > 1) {
        if(recipe.groupSortOrder === undefined || recipe.groupSortOrder.length === 0) {
            recipe.groupSortOrder = ingredientGroups;
        } else {
            recipe.groupSortOrder = ingredientGroups.sort((a, b) => {
                const aIdx = recipe.groupSortOrder.indexOf(a);
                const bIdx = recipe.groupSortOrder.indexOf(b);
                if(aIdx === bIdx) { return 0; }
                if(aIdx < 0) { return 1; }
                if(bIdx < 0) { return -1; }
                return aIdx - bIdx;
            });
        }
        const html = recipe.groupSortOrder.map((e, i) => Sanitize`<li class="ingGroup" data-id="${i}"><i class="material-icons handle">unfold_more</i> ${e || "[blank]"}</li>`);
        $("#ingredientGroups").html(html.join(""));
    } else if(ingredientGroups[0] === "") {
        $("#ingredientGroups").html(`<li>This recipe has no ingredient groups to sort. Add some when creating/editing ingredients if you want to sort them.</li>`);
    } else {
        $("#ingredientGroups").html(`<li>This recipe only has one ingredient group, so there's no need to sort it.</li>`);
    }
}

// Actions
function RecipeClick(e, $t) {
    const targType = e.target.tagName.toLowerCase();
    const idx = parseInt($t.attr("data-id"));
    const $clicked = $(e.target);
    if($t.find(".restoreItem").length > 0 && targType !== "i") { return; }
    if(targType === "i") { // button
        if($clicked.closest(".settings").length) { return; } // settings
        if($clicked.hasClass("restoreItem")) { // Recover From Recycle Bin
            const listIdx = $clicked.attr("data-parent");
            data.RestoreDataItem(listIdx, idx);
            ShowRecycleBin();
            return;
        } else if($clicked.hasClass("goToResult")) { // Search
            const listIdx = $clicked.attr("data-parent");
            SelectDatalist.call($(Sanitize`#sidebarData > li[data-id='${listIdx}']`));
            $(Sanitize`#recipeitem${idx} .edit`).click();
            document.documentElement.scrollTop = $(Sanitize`#recipeitem${idx}`).offset().top - 40;
        } else { // Edit
            if($clicked.hasClass("dispTag")) { return; }
            ToggleDataItemSettings($t, idx, "recipe");
        }
        return;
    } else if($clicked.hasClass("addtlRecipeDetails")) {
        // this is fine
    } else if(targType !== "input" && targType !== "span" && targType !== "li") { // settings
        return;
    }
    ViewRecipe(idx);
}

function IsValidNumberString(i) {
    const values = i.split("-");
    if(values.length > 2) { return false; }
    return !values.some(e => e.trim().match(/^~?([0-9]+)((\.|\/|,)[0-9]+)?$/g) === null);
}
function StringToNumber(str) {
    const isApproximate = str[0] === "~";
    if(isApproximate) { str = str.substring(1); }
    try {
        return { fraction: new Fraction(str), approx: isApproximate };
    } catch {
        return { fraction: new Fraction(1), approx: isApproximate };
    }
}
function GetServingSizeAdjustedIngredient(ingredient, baseServingSize, newServingSizeObj) {
    if(newServingSizeObj.fraction.equals(baseServingSize) || ["none", "toTaste"].indexOf(ingredient.unit) >= 0) { return ingredient; }
    const oldAmt = new Fraction(ingredient.amount);
    const newAmt = oldAmt.mul(newServingSizeObj.fraction).div(baseServingSize);
    const newUnitAndAmount = AdjustUnitToNewAmount(ingredient.unit, oldAmt, newAmt);
    const newIngredient = new Ingredient(ingredient.ingredient, newUnitAndAmount.amount, newUnitAndAmount.unit, ingredient.group);
    if(ingredient.range !== undefined) {
        const oldRange = new Fraction(ingredient.range);
        const rangeMult = oldRange.div(oldAmt);
        newIngredient.range = rangeMult.mul(newUnitAndAmount.amount);
    }
    return newIngredient;
}
function AdjustUnitToNewAmount(unit, oldAmount, newAmount) {
    if(unit === "ºF" || unit === "ºC") { return { unit: unit, amount: oldAmount }; }
    const obj = { unit: unit, amount: newAmount };
    if(["", "pinch", "dash"].indexOf(unit) >= 0 || newAmount == oldAmount) { return obj; }
    if(newAmount.compare(oldAmount) > 0) {
        if(["gal", "L", "lb", "kg", "m", "ft"].indexOf(unit) >= 0) {
            return obj; // these are already the largest units of their type
        }
    } else {
        if(["tspv", "tspm", "fl oz", "mL", "oz", "mg", "mm", "in"].indexOf(unit) >= 0) {
            return obj; // these are already the smallest units of their type
        }
    }
    switch(unit) {
        // Volume - Imperial
        case "tsp": return ShiftFromTsp(newAmount);
        case "tbsp": return ShiftFromTsp(newAmount.mul(3));
        case "fl oz": return ShiftFromTsp(newAmount.mul(6));
        case "cup": return ShiftFromTsp(newAmount.mul(48));
        case "qt": return ShiftFromTsp(newAmount.mul(192));
        case "gal": return ShiftFromTsp(newAmount.mul(768));
        // Volume - Metric
        case "mL": return ShiftFromMilliliter(newAmount);
        case "dL": return ShiftFromMilliliter(newAmount.mul(100));
        case "L": return ShiftFromMilliliter(newAmount.mul(1000));
        // Weight - Imperial
        case "oz":
            if(newAmount >= 16) {
                return { unit: "lb", amount: newAmount.div(16) };
            } else { return obj; }
        case "lb":
            if(newAmount < 1) {
                return { unit: "oz", amount: newAmount.mul(16) };
            } else { return obj; }
        // Weight - Metric
        case "mg": return ShiftFromMilligram(newAmount);
        case "g": return ShiftFromMilligram(newAmount.mul(1000));
        case "kg": return ShiftFromMilligram(newAmount.mul(1000000));
        // Length - Imperial
        case "in": 
            if(newAmount >= 12) {
                return { unit: "ft", amount: newAmount.div(12) };
            } else { return obj; }
        case "lb":
            if(newAmount < 1) {
                return { unit: "in", amount: newAmount.mul(12) };
            } else { return obj; }
        // Length - Metric
        case "mm": return ShiftFromMillimeter(newAmount);
        case "cm": return ShiftFromMillimeter(newAmount.mul(10));
        case "m": return ShiftFromMillimeter(newAmount.mul(1000));
    }
    return obj;
}
function ShiftFromTsp(amount) {
    if(amount < 3) { return { unit: "tsp", amount: amount }; }
    if(amount < 12) { return { unit: "tbsp", amount: amount.div(3) } };
    if(amount < 16) { return { unit: "fl oz", amount: amount.div(6) }; }
    if(amount < 192) { return { unit: "cup", amount: amount.div(48) }; }
    if(amount < 768) { return { unit: "qt", amount: amount.div(192) }; }
    return { unit: "gal", amount: amount.div(768) };
}
function ShiftFromMilliliter(amount) {
    if(amount < 200) { return { unit: "mL", amount: amount }; }
    if(amount >= 1000) { return { unit: "L", amount: amount.div(1000) }; }
    return { unit: "dL", amount: amount.div(100) };
}
function ShiftFromMilligram(amount) {
    if(amount < 1000) { return { unit: "mg", amount: amount }; }
    if(amount >= 1000000) { return { unit: "kg", amount: amount.div(1000000) }; }
    return { unit: "g", amount: amount.div(1000) };
}
function ShiftFromMillimeter(amount) {
    if(amount < 10) { return { unit: "mm", amount: amount }; }
    if(amount >= 1000) { return { unit: "m", amount: amount.div(1000) }; }
    return { unit: "cm", amount: amount.div(10) };
}
function ConvertBetweenMetricAndImperial(unit, amount, rawunit, range) {
    switch(unit) {
        // temperature
        case "ºF": return { unit: "ºC", amount: amount.add(-32).mul(5, 9), range: range === undefined ? undefined : range.add(-32).mul(5, 9) };
        case "ºC": return { unit: "ºF", amount: amount.mul(9, 5).add(32), range: range === undefined ? undefined : range.mul(9, 5).add(32) };
        // weight/mass
        case "oz":
            if(amount >= 35.274) { return { unit: "kg", amount: amount.div(35.274), range: range === undefined ? undefined : range.div(35.274), range: range === undefined ? undefined : range.div(35.274) }; }
            else { return { unit: "g", amount: amount.mul(28.35), range: range === undefined ? undefined : range.mul(28.35) }; }
        case "lb":
            if(amount >= 2.205) { return { unit: "kg", amount: amount.div(2.205), range: range === undefined ? undefined : range.div(2.205) }; }
            else { return { unit: "g", amount: amount.mul(453.592), range: range === undefined ? undefined : range.mul(453.592) }; }
        case "mg":
            return { unit: "oz", amount: amount.div(28350), range: range === undefined ? undefined : range.div(28350) };
        case "g":
            if(amount >= 453.592) { return { unit: "lb", amount: amount.div(453.592), range: range === undefined ? undefined : range.div(453.592) }; }
            else { return { unit: "oz", amount: amount.div(28.35), range: range === undefined ? undefined : range.div(28.35) }; }
        case "kg":
            if(amount >= 0.453592) { return { unit: "lb", amount: amount.mul(2.205), range: range === undefined ? undefined : range.mul(2.205) }; }
            else { return { unit: "oz", amount: amount.mul(35.274), range: range === undefined ? undefined : range.mul(35.274) }; }
        // Length
        case "in":
            if(amount < 0.3937) { return { unit: "mm", amount: amount.mul(25.4), range: range === undefined ? undefined : range.mul(25.4) }; }
            if(amount < 39.3701) { return { unit: "cm", amount: amount.mul(2.54), range: range === undefined ? undefined : range.mul(2.54) }; }
            return { unit: "m", amount: amount.div(39.3701), range: range === undefined ? undefined : range.div(39.3701) };
        case "ft":
            if(amount < 0.032) { return { unit: "mm", amount: amount.mul(304.8), range: range === undefined ? undefined : range.mul(304.8) }; }
            if(amount < 3.28) { return { unit: "cm", amount: amount.mul(30.48), range: range === undefined ? undefined : range.mul(30.48) }; }
            return { unit: "m", amount: amount.div(3.281), range: range === undefined ? undefined : range.div(3.281) };
        case "mm":
            if(amount <= 304.8) { return { unit: "in", amount: amount.div(25.4), range: range === undefined ? undefined : range.div(25.4) }; }
            else { return { unit: "ft", amount: amount.div(304.8), range: range === undefined ? undefined : range.div(304.8) }; }
        case "cm":
            if(amount < 30.48) { return { unit: "in", amount: amount.div(2.54), range: range === undefined ? undefined : range.div(2.54) }; }
            else { return { unit: "ft", amount: amount.div(30.48), range: range === undefined ? undefined : range.div(30.48) }; }
        case "m":
            return { unit: "ft", amount: amount.mul(3.281), range: range === undefined ? undefined : range.mul(3.281) };
        // volume
        case "tsp":
            if(amount < 20.2884) { return {unit: "mL", amount: amount.mul(4.92892), range: range === undefined ? undefined : range.mul(4.92892) }; }
            if(amount < 202.884) { return {unit: "dL", amount: amount.div(20.2884), range: range === undefined ? undefined : range.div(20.2884) }; }
            return {unit: "L", amount: amount.div(202.884), range: range === undefined ? undefined : range.div(202.884) };
        case "tbsp":
            if(amount < 6.7628) { return {unit: "mL", amount: amount.mul(14.7868), range: range === undefined ? undefined : range.mul(14.7868) }; }
            if(amount < 67.628) { return {unit: "dL", amount: amount.div(6.7628), range: range === undefined ? undefined : range.div(6.7628) }; }
            return {unit: "L", amount: amount.div(67.628), range: range === undefined ? undefined : range.div(67.628) };
        case "fl oz":
            if(amount < 3.3814) { return {unit: "mL", amount: amount.mul(29.5735), range: range === undefined ? undefined : range.mul(29.5735) }; }
            if(amount < 33.814) { return {unit: "dL", amount: amount.div(3.3814), range: range === undefined ? undefined : range.div(3.3814) }; }
            return {unit: "L", amount: amount.div(33.814), range: range === undefined ? undefined : range.div(33.814) };
        case "cup":
            if(amount < 4.22675) { return {unit: "dL", amount: amount.mul(2.36588), range: range === undefined ? undefined : range.mul(2.36588) }; }
            return {unit: "L", amount: amount.div(4.22675), range: range === undefined ? undefined : range.div(4.22675) };
        case "qt":
            if(amount < 1.05669) { return {unit: "dL", amount: amount.mul(9.46353), range: range === undefined ? undefined : range.mul(9.46353) }; }
            return {unit: "L", amount: amount.div(1.05669), range: range === undefined ? undefined : range.div(1.05669) };
        case "gal":
            if(amount < 0.264172) { return {unit: "dL", amount: amount.mul(37.8541), range: range === undefined ? undefined : range.mul(37.8541) }; }
            return {unit: "L", amount: amount.mul(3.785), range: range === undefined ? undefined : range.mul(3.785) };
        case "ml":
        case "mL":
            if(amount < 14.7868) { return {unit: "tsp", amount: amount.div(4.92892), range: range === undefined ? undefined : range.div(4.92892) }; }
            if(amount < 29.5735) { return {unit: "tbsp", amount: amount.div(14.7868), range: range === undefined ? undefined : range.div(14.7868) }; }
            if(amount < 946.353) {
                if(rawunit === "cup") {
                    return { unit: "cup", amount: amount.div(236.588), range: range === undefined ? undefined : range.div(236.588) };
                } else {
                    return { unit: "fl oz", amount: amount.div(29.5735), range: range === undefined ? undefined : range.div(29.5735) };
                }
            }
            if(amount < 3785.41) { return {unit: "qt", amount: amount.div(946.353), range: range === undefined ? undefined : range.div(946.353) }; }
            return {unit: "gal", amount: amount.div(3785.41), range: range === undefined ? undefined : range.div(3785.41) };
        case "dl":
        case "dL":
            if(amount < 0.147868) { return {unit: "tsp", amount: amount.mul(20.2884), range: range === undefined ? undefined : range.mul(20.2884) }; }
            if(amount < 0.295735) { return {unit: "tbsp", amount: amount.mul(6.7628), range: range === undefined ? undefined : range.mul(6.7628) }; }
            if(amount < 9.46353) {
                if(rawunit === "cup") {
                    return { unit: "cup", amount: amount.div(2.36588), range: range === undefined ? undefined : range.div(2.36588) };
                } else {
                    return { unit: "fl oz", amount: amount.mul(3.3814), range: range === undefined ? undefined : range.mul(3.3814) };
                }
            }
            if(amount < 37.8541) { return {unit: "qt", amount: amount.div(9.46353), range: range === undefined ? undefined : range.div(9.46353) }; }
            return {unit: "gal", amount: amount.div(37.8541), range: range === undefined ? undefined : range.div(37.8541) };
        case "l":
        case "L":
            if(amount < 1.05669) {
                if(rawunit === "cup") {
                    return { unit: "cup", amount: amount.mul(4.22675), range: range === undefined ? undefined : range.mul(4.22675) };
                } else {
                    return {unit: "fl oz", amount: amount.mul(33.814), range: range === undefined ? undefined : range.mul(33.814) };
                }
            }
            if(amount < 3.78541) { return {unit: "qt", amount: amount.mul(1.05669), range: range === undefined ? undefined : range.mul(1.05669) }; }
            return {unit: "gal", amount: amount.div(3.785), range: range === undefined ? undefined : range.div(3.785) };
    }
    return { unit: unit, amount: amount, range: range };
}

function AdjustStep(step, baseServingSize, newServingSizeObj) {
    return he.encode(step, { useNamedReferences: true }).replace(/\[(~?)([0-9]+(?:(?:\.|\/|,)[0-9]+)?)(?: ?- ?([0-9]+(?:(?:\.|\/|,)[0-9]+)?))?(?:[ º])?([A-Za-z ]*)]/g, 
    function(whole, tilde, number, secondNumber, unit) {
        const originalAmount = StringToNumber(number);
        unit = CleanUserUnit(unit);
        const newAmount = originalAmount.fraction.mul(newServingSizeObj.fraction).div(baseServingSize);
        const finalUnitAndAmount = AdjustUnitToNewAmount(unit, originalAmount.fraction, newAmount);
        let rangeAmt = undefined;
        if(secondNumber !== undefined) {
            const oldRange = new Fraction(secondNumber);
            const rangeMult = oldRange.div(originalAmount.fraction);
            rangeAmt = rangeMult.mul(finalUnitAndAmount.amount);
        }
        return GetAdjustableIngredientHTML(finalUnitAndAmount.amount, finalUnitAndAmount.unit, tilde, finalUnitAndAmount.unit !== "", unit, rangeAmt);
    });
}
const validUnits = ["ºF", "ºC", 
                    "tsp", "tbsp", "cup",  
                    "fl oz", "qt", "gal", "ml", "dl", "l", "mL", "dL", "L", 
                    "lb", "oz", "mg", "g", "kg", 
                    "mm", "cm", "m", "in", "ft"];
function GetAdjustableIngredientHTML(amount, unit, tilde, isConvertible, originalUnit, rangeAmount) {
    if(validUnits.indexOf(unit) < 0) { isConvertible = false; }
    amount = amount.round(5);
    const showAsFraction = amount.d <= 10;
    const amountToStore = showAsFraction ? amount.toFraction() : amount.toString();
    let amountToShow = GetDisplayNumber(amount, showAsFraction);
    let rangeToStore = "";
    if(rangeAmount !== undefined) {
        rangeAmount = new Fraction(rangeAmount).round(5);
        const showRangeAsFraction = rangeAmount.d <= 10;
        rangeToStore = showRangeAsFraction ? rangeAmount.toFraction() : rangeAmount.toString();
        amountToShow += " - " + GetDisplayNumber(rangeAmount, showRangeAsFraction);
    }
    if(isConvertible) {
        return SanitizeException(6)`
        <span class="unitInfo step-unit" data-rawUnit="${originalUnit || ""}" 
                                         data-tilde="${tilde}" 
                                         data-amount="${amountToStore}" 
                                         data-range="${rangeToStore}"
                                         data-unit="${unit}">
            ${tilde}${amountToShow}${GetUnitDisplay(unit, amount, rangeAmount)}</span>`;
    } else if(unit === "toTaste" || unit === "none") {
        return "";
    } else {
        return SanitizeException(1)`<span class="unitInfo">${tilde}${amountToShow}${GetUnitDisplay(unit, amount, rangeAmount)}</span>`;
    }
}
function GetUnitDisplay(unit, amount, rangeAmount) {
    if(unit === "") { return " "; }
    if(["ºF", "ºC"].indexOf(unit) >= 0) { return unit; }
    if(unit === "cup") { return (amount == 1 && rangeAmount === undefined) ? " cup" : " cups"; }
    if(unit === "tsp") { return "tsp"; }
    if(unit === "tbsp") { return "tbsp"; }
    if(unit === "ml") { return "mL"; }
    if(unit === "dl") { return "dL"; }
    if(unit === "l") { return "L"; }
    return ` ${unit}`;
}
function GetDisplayNumber(amount, showAsFraction) {
    return showAsFraction ? amount.toFraction(true).replace(/^(\d+)? ?(\d+)\/(\d+)$/, "$1<sup>$2</sup>&frasl;<sub>$3</sub>") : amount.round(3).toString();
}

const unitSynonyms = {
    "f": "ºF",
    "ºf": "ºF",
    "c": "ºC",
    "ºc": "ºC",
    "teaspoon": "tsp",
    "teaspoons": "tsp",
    "tablespoon": "tbsp",
    "tablespoons": "tbsp",
    "fl. oz": "fl oz",
    "floz": "fl oz",
    "fluid oz": "fl oz",
    "fluid ounce": "fl oz",
    "fluid ounces": "fl oz",
    "cups": "cup",
    "quart": "qt",
    "quarts": "qt",
    "gallon": "gal",
    "gallons": "gal",
    "milliliter": "mL",
    "milliliters": "mL",
    "millilitre": "mL",
    "millilitres": "mL",
    "deciliter": "dL",
    "deciliters": "dL",
    "decilitre": "dL",
    "decilitres": "dL",
    "liter": "L",
    "liters": "L",
    "litre": "L",
    "litres": "L",
    "pounds": "lb",
    "pound": "lb",
    "lbs": "lb",
    "ounce": "oz",
    "ounces": "oz",
    "milligram": "mg",
    "milligrams": "mg",
    "gram": "g",
    "grams": "g",
    "kilogram": "kg",
    "kilograms": "kg",
    "millimeter": "mm",
    "millimeters": "mm",
    "millimetre": "mm",
    "millimetres": "mm",
    "centimeter": "cm",
    "centimeters": "cm",
    "centimetre": "cm",
    "centimetres": "cm",
    "meter": "m",
    "meters": "m",
    "metre": "m",
    "metres": "m",
    "inch": "in",
    "inches": "in",
    "foot": "ft",
    "feet": "ft"
};
function CleanUserUnit(unit) {
    unit = unit.toLowerCase();
    const syn = unitSynonyms[unit];
    return syn || unit;
}

function CalibrateIngredientAmounts(recipe, amount) {
    $("#currentServingSize").val(amount.fraction.toString());
    DrawRecipe(recipe, amount);
}

const NQ = s => s.replace(/\"/g, "\\\"");
function PrettyPrintRecipe(idx) {
    const list = CurList();
    const item = list.data[idx];
    if(item === undefined) { return; }
    const ings = item.ingredience.map(e => {
        const groupVal = e.group === "" ? "" : `"group": "${NQ(e.group)}", `;
        return `{ ${groupVal}"amount": "${e.amount}", "unit": "${e.unit}", "ingredient": "${NQ(e.ingredient)}" }`;
    });
    const json = `{
    "name": "${NQ(item.name)}", "servings": "${NQ(item.servings)}",
    "author": "${NQ(item.author)}", "source": "${NQ(item.source)}",
    "prepTime": "${NQ(item.prepTime)}", "cookTime": "${NQ(item.cookTime)}", "totalTime": "${NQ(item.totalTime)}",
    "notes": "${NQ(item.notes)}",
    "tags": [${item.tags.map(e => `"${NQ(list.tags[e].tag)}"`).join(", ")}],
    "ingredience": [
        ${ings.join(",\n\t\t")}
    ],
    "steps": [
        ${item.steps.map(e => `"${NQ(e.step)}"`).join(",\n\t\t")}
    ],
    "important": ${item.important}, "date": ${item.date}, "val": "${NQ(item.val)}"
}`;
    const b = new Blob([json], { type: "application/json" });
    if(typeof cordova !== "undefined") {
        window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory + "Download", function(entry) {
            entry.getFile(`databee_recipe_${item.name}.json`, { create: true, exclusive: false }, function(file) {
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
        a.download = `databee_recipe_${item.name}.json`;
        a.dispatchEvent(new MouseEvent("click"));
    }
}