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
        $("#txtModalAmount").val(ingredient.amount);
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

    $(document).on("click", ".step-unit", function() {
        const unit = $(this).attr("data-unit");
        const amount = new Fraction($(this).attr("data-amount"));
        const newAmount = ConvertBetweenMetricAndImperial(unit, amount);
        $(this).replaceWith(GetAdjustableIngredientHTML(newAmount.amount, newAmount.unit, $(this).attr("data-tilde"), true));
    });
}

// Display
function ViewRecipe(idx) {
    const recipe = CurList().data[idx];
    $(".body, #menuBtn, #menuRight, #recipeEdit").hide();
    $("#bRecipeEditor, #backBtn, #recipeRead, #recipeTopBtns").show();
    $("#title").text(recipe.name);
    ctx.stateForBackButton = "recipeviewer";
    $("#bRecipeEditor").attr("data-id", idx);
    $("#currentServingSize").val(recipe.servings);
    if(recipe.author) {
        $("#recipeBy").show();
        if(recipe.source) {
            if(recipe.source.indexOf("http") === 0) {
                $("#recipeBy").html(Sanitize`Recipe by: <a href="${recipe.source}">${recipe.author}</a>`);
            } else {
                $("#recipeBy").html(Sanitize`Recipe by: ${recipe.author}, ${recipe.source}`);
            }
        } else {
            $("#recipeBy").html(Sanitize`Recipe by: ${recipe.author}`);
        }
    } else {
        $("#recipeBy").hide();
    }
    if(recipe.notes) {
        $("#recipeNotes").text(recipe.notes).show();
    } else {
        $("#recipeNotes").hide();
    }
    const recipeTimeHTML = [];
    if(recipe.prepTime) { recipeTimeHTML.push(Sanitize`<div class="timeInfo"><span>Prep Time</span><span>${recipe.prepTime}</span></div>`); }
    if(recipe.cookTime) { recipeTimeHTML.push(Sanitize`<div class="timeInfo"><span>Cook Time</span><span>${recipe.cookTime}</span></div>`); }
    if(recipe.totalTime) { recipeTimeHTML.push(Sanitize`<div class="timeInfo"><span>Total Time</span><span>${recipe.totalTime}</span></div>`); }
    $("#recipeTimeInfo").html(recipeTimeHTML.join(""));
    $("#recipeHeader > div").removeClass("active");
    $("#btnRecipeFull").addClass("active");
    DrawRecipe(recipe, StringToNumber(`${recipe.servings}`));
}
function DrawRecipe(recipe, servingsObj) {
    recipe.ingredience.sort((a, b) => a.group.localeCompare(b.group));
    $("#ingredientViewList").html(recipe.ingredience.map((e, i) => {
        const lastGroup = (i === 0 ? "" : recipe.ingredience[i - 1].group);
        const categoryPrefix = (lastGroup !== e.group) ? Sanitize`<li class="ingredientHeader">${e.group}</li>` : "";
        if(e.unit === "toTaste") { return SanitizeException(0)`${categoryPrefix}<li data-id="${i}" class="viewIngredient">${e.ingredient}, to taste</li>`; }
        const adjustedRecipe = GetServingSizeAdjustedIngredient(e, recipe.servings, servingsObj);
        const hasTilde = adjustedRecipe.amount[0] === "~";
        if(hasTilde) { adjustedRecipe.amount = adjustedRecipe.amount.substring(1); }
        if(typeof adjustedRecipe.fraction === "object") { 
            adjustedRecipe.fraction = new Fraction(adjustedRecipe.fraction);
        } else {
            adjustedRecipe.fraction = new Fraction(adjustedRecipe.fraction.replace("~", "") || 0);
        }
        const amt = adjustedRecipe.fraction === undefined ? new Fraction(adjustedRecipe.amount || 0) : adjustedRecipe.fraction;
        return SanitizeException(0, 2)`${categoryPrefix}<li data-id="${i}" class="viewIngredient">
            ${GetAdjustableIngredientHTML(amt, adjustedRecipe.unit, hasTilde ? "~" : "", adjustedRecipe.unit !== "")} ${adjustedRecipe.ingredient}
        </li>`}).join(""));
    $("#stepViewList").html(recipe.steps.map((e, i) => SanitizeException(2)`
    <li data-id="${i}" class="viewStep">
        <span>${i + 1}. ${AdjustStep(e.step, recipe.servings, servingsObj)}</span>
    </li>`).join(""));
}
function EditRecipe(idx) {
    const recipe = CurList().data[idx];
    $(".body, #menuBtn, #menuRight, #recipeRead, #recipeTopBtns").hide();
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
        ${(e.unit === "toTaste" || e.unit === "none") ? Sanitize`<span>${e.ingredient}${e.unit === "toTaste" ? ", to taste" : ""}</span>` : Sanitize`<span>${e.amount}${GetUnitDisplay(e.unit, e.amount)} ${e.ingredient}</span>`}
        <i class="material-icons recipeEditBtn recipeEdit">edit</i>
        <i class="material-icons recipeEditBtn recipeDel">delete</i>
    </li>`).join(""));
    $("#stepEditList").html(recipe.steps.map((e, i) => Sanitize`
    <li data-id="${i}" class="editStep">
        <span>${i + 1}. ${e.step}</span>
        <i class="material-icons recipeEditBtn recipeEdit">edit</i>
        <i class="material-icons recipeEditBtn recipeDel">delete</i>
    </li>`).join(""));
}

// Actions
function RecipeClick(e, $t) {
    const targType = e.target.tagName.toLowerCase();
    const idx = parseInt($t.attr("data-id"));
    const $clicked = $(e.target);
    if(targType === "i") { // button
        if($clicked.closest(".settings").length) { return; } // settings
        if($clicked.hasClass("goToResult")) { // Search
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

function IsValidNumberString(i) { return i.match(/^~?([0-9]+)((\.|\/|,)[0-9]+)?$/g) !== null; }
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
    newIngredient.checked = ingredient.checked;
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
        case "tspv": return ShiftFromTsp(newAmount, true);
        case "tbspv": return ShiftFromTsp(newAmount.mul(3), true);
        case "fl oz": return ShiftFromTsp(newAmount.mul(6), true);
        case "cupv": return ShiftFromTsp(newAmount.mul(48), true);
        case "qt": return ShiftFromTsp(newAmount.mul(192), true);
        case "gal": return ShiftFromTsp(newAmount.mul(768), true);
        // Volume - Metric
        case "mL": return ShiftFromMilliliter(newAmount);
        case "dL": return ShiftFromMilliliter(newAmount.mul(100));
        case "L": return ShiftFromMilliliter(newAmount.mul(1000));
        // Weight - Imperial
        case "tspm": return ShiftFromTsp(newAmount, false);
        case "tbspm": return ShiftFromTsp(newAmount.mul(3), false);
        case "cupm": return ShiftFromTsp(newAmount.mul(48), false);
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
function ShiftFromTsp(amount, isVolume) {
    if(amount < 3) { return { unit: `tsp${isVolume?"v":"m"}`, amount: amount }; }
    if(amount < 12) { return { unit: `tbsp${isVolume?"v":"m"}`, amount: amount.div(3) } };
    if(isVolume) {
        if(amount < 16) { return { unit: "fl oz", amount: amount.div(6) }; }
        if(amount < 192) { return { unit: "cupv", amount: amount.div(48) }; }
        if(amount < 768) { return { unit: "qt", amount: amount.div(192) }; }
        return { unit: "gal", amount: amount.div(768) };
    } else {
        return { unit: "cupm", amount: amount.div(48) };
    }
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
function ConvertBetweenMetricAndImperial(unit, amount) {
    switch(unit) {
        // temperature
        case "ºF": return { unit: "ºC", amount: amount.add(-32).mul(5, 9) };
        case "ºC": return { unit: "ºF", amount: amount.mul(9, 5).add(32) };
        // weight/mass
        case "tspm":
            if(amount >= 202.8841362) { return { unit: "kg", amount: amount.div(202.8841362) }; }
            else { return { unit: "g", amount: amount.mul(4.928921594) }; }
        case "tbspm":
            if(amount >= 67.6280454) { return { unit: "kg", amount: amount.div(67.6280454) }; }
            else { return { unit: "g", amount: amount.mul(14.7867648) }; }
        case "cupm":
            if(amount >= 4.226752838) { return { unit: "kg", amount: amount.div(4.226752838) }; }
            else { return { unit: "g", amount: amount.mul(136) }; }
        case "oz":
            if(amount >= 35.274) { return { unit: "kg", amount: amount.div(35.274) }; }
            else { return { unit: "g", amount: amount.mul(28.35) }; }
        case "lb":
            if(amount >= 2.205) { return { unit: "kg", amount: amount.div(2.205) }; }
            else { return { unit: "g", amount: amount.mul(453.592) }; }
        case "mg":
            return { unit: "oz", amount: amount.div(28350) };
        case "g":
            if(amount >= 453.592) { return { unit: "lb", amount: amount.div(453.592) }; }
            else { return { unit: "oz", amount: amount.div(28.35) }; }
        case "kg":
            if(amount >= 0.453592) { return { unit: "lb", amount: amount.mul(2.205) }; }
            else { return { unit: "oz", amount: amount.mul(35.274) }; }
        // Length
        case "in":
            if(amount < 0.3937) { return { unit: "mm", amount: amount.mul(25.4) }; }
            if(amount < 39.3701) { return { unit: "cm", amount: amount.mul(2.54) }; }
            return { unit: "m", amount: amount.div(39.3701) };
        case "ft":
            if(amount < 0.032) { return { unit: "mm", amount: amount.mul(304.8) }; }
            if(amount < 3.28) { return { unit: "cm", amount: amount.mul(30.48) }; }
            return { unit: "m", amount: amount.div(3.281) };
        case "mm":
            if(amount <= 304.8) { return { unit: "in", amount: amount.div(25.4) }; }
            else { return { unit: "ft", amount: amount.div(304.8) }; }
        case "cm":
            if(amount < 30.48) { return { unit: "in", amount: amount.div(2.54) }; }
            else { return { unit: "ft", amount: amount.div(30.48) }; }
        case "m":
            return { unit: "ft", amount: amount.mul(3.281) };
        // volume
        case "tspv":
            if(amount < 20.2884) { return {unit: "mL", amount: amount.mul(4.92892) }; }
            if(amount < 202.884) { return {unit: "dL", amount: amount.div(20.2884) }; }
            return {unit: "L", amount: amount.div(202.884) };
        case "tbspv":
            if(amount < 6.7628) { return {unit: "mL", amount: amount.mul(14.7868) }; }
            if(amount < 67.628) { return {unit: "dL", amount: amount.div(6.7628) }; }
            return {unit: "L", amount: amount.div(67.628) };
        case "fl oz":
            if(amount < 3.3814) { return {unit: "mL", amount: amount.mul(29.5735) }; }
            if(amount < 33.814) { return {unit: "dL", amount: amount.div(3.3814) }; }
            return {unit: "L", amount: amount.div(33.814) };
        case "cupv":
            if(amount < 4.22675) { return {unit: "dL", amount: amount.mul(2.36588) }; }
            return {unit: "L", amount: amount.div(4.22675) };
        case "qt":
            if(amount < 1.05669) { return {unit: "dL", amount: amount.mul(9.46353) }; }
            return {unit: "L", amount: amount.div(1.05669) };
        case "gal":
            if(amount < 0.264172) { return {unit: "dL", amount: amount.mul(37.8541) }; }
            return {unit: "L", amount: amount.mul(3.785) };
        case "ml":
        case "mL":
            if(amount < 14.7868) { return {unit: "tspv", amount: amount.div(4.92892) }; }
            if(amount < 29.5735) { return {unit: "tbspv", amount: amount.div(14.7868) }; }
            if(amount < 946.353) { return {unit: "fl oz", amount: amount.div(29.5735) }; }
            if(amount < 3785.41) { return {unit: "qt", amount: amount.div(946.353) }; }
            return {unit: "gal", amount: amount.div(3785.41) };
        case "dl":
        case "dL":
            if(amount < 0.147868) { return {unit: "tspv", amount: amount.mul(20.2884) }; }
            if(amount < 0.295735) { return {unit: "tbspv", amount: amount.mul(6.7628) }; }
            if(amount < 9.46353) { return {unit: "fl oz", amount: amount.mul(3.3814) }; }
            if(amount < 37.8541) { return {unit: "qt", amount: amount.div(9.46353) }; }
            return {unit: "gal", amount: amount.div(37.8541) };
        case "l":
        case "L":
            if(amount < 1.05669) { return {unit: "fl oz", amount: amount.mul(33.814) }; }
            if(amount < 3.78541) { return {unit: "qt", amount: amount.mul(1.05669) }; }
            return {unit: "gal", amount: amount.div(3.785) };
    }
    return { unit: unit, amount: amount };
}

function AdjustStep(step, baseServingSize, newServingSizeObj) {
    return he.encode(step, { useNamedReferences: true }).replace(/\[(~?)([0-9]+(?:(?:\.|\/|,)[0-9]+)?)(?:[ º])?([A-Za-z ]*)]/g, function(whole, tilde, number, unit) {
        const originalAmount = StringToNumber(number);
        unit = CleanUserUnit(unit);
        const newAmount = originalAmount.fraction.mul(newServingSizeObj.fraction).div(baseServingSize);
        const finalUnitAndAmount = AdjustUnitToNewAmount(unit, originalAmount.fraction, newAmount);
        return GetAdjustableIngredientHTML(finalUnitAndAmount.amount, finalUnitAndAmount.unit, tilde, finalUnitAndAmount.unit !== "");
    }).replace(/\[([0-9]+(?:(?:\.|\/|,)[0-9]+)?)]/g, function(number) {
        const newAmount = new Fraction(number).mul(newServingSizeObj.fraction).div(baseServingSize);
        return newAmount;
    });
}
const validUnits = ["ºF", "ºC", 
                    "tsp", "tbsp", "cup", 
                    "tspv", "tbspv", "cupv", 
                    "tspm", "tbspm", "cupm", 
                    "fl oz", "qt", "gal", "ml", "dl", "l", "mL", "dL", "L", 
                    "lb", "oz", "mg", "g", "kg", 
                    "mm", "cm", "m", "in", "ft"];
function GetAdjustableIngredientHTML(amount, unit, tilde, isConvertible) {
    if(validUnits.indexOf(unit) < 0) { isConvertible = false; }
    amount = amount.round(5);
    const showAsFraction = amount.d <= 10;
    const amountToStore = showAsFraction ? amount.toFraction() : amount.toString();
    let amountToShow = GetDisplayNumber(amount, showAsFraction);
    if(isConvertible) {
        return SanitizeException(4)`<span class="step-unit" data-tilde="${tilde}" data-amount="${amountToStore}" data-unit="${unit}">${tilde}${amountToShow}${GetUnitDisplay(unit, amount)}</span>`;
    } else if(unit === "toTaste" || unit === "none") {
        return "";
    } else {
        return SanitizeException(1)`<span>${tilde}${amountToShow}${GetUnitDisplay(unit, amount)}</span>`;
    }
}
function GetUnitDisplay(unit, amount) {
    if(unit === "") { return " "; }
    if(["ºF", "ºC"].indexOf(unit) >= 0) { return unit; }
    if(["cup", "cupv", "cupm"].indexOf(unit) >= 0) { return amount === 1 ? " cup" : " cups"; }
    if(unit === "tspv" || unit === "tspm") { return "tsp"; }
    if(unit === "tbspv" || unit === "tbspm") { return "tbsp"; }
    if(unit === "ml") { return "mL"; }
    if(unit === "dl") { return "dL"; }
    if(unit === "l") { return "L"; }
    return ` ${unit}`;
}
function GetDisplayNumber(amount, showAsFraction) {
    if(showAsFraction === undefined) { showAsFraction = amount.d <= 10; }
    return showAsFraction ? amount.toFraction(true).replace(/^(\d+)? ?(\d+)\/(\d+)$/, "$1<sup>$2</sup>&frasl;<sub>$3</sub>") : amount.round(3).toString();
}

const unitSynonyms = {
    "f": "ºF",
    "ºf": "ºF",
    "c": "ºC",
    "ºc": "ºC",
    "teaspoon": "tspv",
    "teaspoons": "tspv",
    "tablespoon": "tbspv",
    "tablespoons": "tbspv",
    "fl. oz": "fl oz",
    "floz": "fl oz",
    "fluid oz": "fl oz",
    "fluid ounce": "fl oz",
    "fluid ounces": "fl oz",
    "cups": "cupv",
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