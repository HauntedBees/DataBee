function SetUpCookbook() {
    $("#btnAddRecipe").on("click", function() { ShowInputModal("newCookbook", "New Cookbook", "New Cookbook", "Create"); });
    $("#btnAddIngredient").on("click", function() {
        ShowModal("modalAddIngredient", true);
        $("#btnConfirmIngredient").text("Add");
        $("#modalAddIngredient > div > .modalHeader").text("Add Ingredient");
        $("#modalAddIngredient").attr("data-id", "");
        $("#ddlModalUnit").val("");
        $("#matterType > button").removeClass("button-primary");
        $("#matterType > button:first").addClass("button-primary");
        $("#ddlModalUnit .liquid").hide();
        $("#ddlModalUnit .solid").show();
        $("#txtModalIngredient").focus();
    });
    $("#matterType > button").on("click", function() {
        $("#matterType > button").removeClass("button-primary");
        $(this).addClass("button-primary");
        $("#ddlModalUnit .liquid, #ddlModalUnit .solid").hide();
        $(`#ddlModalUnit .${$(this).attr("data-type")}`).show();
    });
    $("#btnConfirmIngredient").on("click", function() {
        $("#modalAddIngredient .comeOn").removeClass("comeOn");
        const ing = $("#txtModalIngredient").val();
        if(ing === "") {
            $("#txtModalIngredient").addClass("comeOn");
            return;
        }
        const amt = $("#txtModalAmount").val();
        if(amt === "") {
            $("#txtModalAmount").addClass("comeOn");
            return;
        } else if(!IsValidNumberString(amt)) {
            $("#txtModalAmount").addClass("comeOn").val("Integer, decimal, or fraction.").focus().select();
            return;
        }
        const unit = $("#ddlModalUnit").val();
        const isLiquid = $("#matterType > .button-primary").attr("data-type") === "liquid";
        const ingredient = new Ingredient(ing, amt, unit, isLiquid);

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
        const ingredient = dbData.dbList[dbData.currentScreen].data[recipeIdx].ingredience[ingId];
        ShowModal("modalAddIngredient", true);
        $("#matterType > button").removeClass("button-primary");
        $(`#matterType > button[data-type=${ingredient.isLiquid?"liquid":"solid"}]`).addClass("button-primary");
        $("#modalAddIngredient").attr("data-id", ingId);
        $("#txtModalIngredient").val(ingredient.ingredient);
        $("#txtModalAmount").val(ingredient.amount);
        $("#ddlModalUnit").val(ingredient.unit);
    });
    $(".servingSizeAdjustment").on("click", function() {
        const dir = $(this).attr("data-dir") === "1" ? 1 : -1;
        const currentVal = $("#currentServingSize").val();
        const recipeIdx = parseInt($("#bRecipeEditor").attr("data-id"));
        const recipe = dbData.dbList[dbData.currentScreen].data[recipeIdx];
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
        const recipe = dbData.dbList[dbData.currentScreen].data[recipeIdx];
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

    $("#stepViewList").on("click", ".step-unit", function() {
        const unit = $(this).attr("data-unit");
        const amount = new Fraction($(this).attr("data-amount"));
        const newAmount = ConvertBetweenMetricAndImperial(unit, amount);
        $(this).replaceWith(GetAdjustableStepIngredientHTML(newAmount.amount, newAmount.unit, $(this).attr("data-tilde"), true));
    });
    // TODO: click event, settings
}

// Display

/* Cookbook */
function ViewRecipe(idx) {
    const recipe = dbData.dbList[dbData.currentScreen].data[idx];
    $(".body, #menuBtn, #menuRight, #recipeEdit").hide();
    $("#bRecipeEditor, #backBtn, #recipeRead, #recipeTopBtns").show();
    $("#title").text(recipe.name);
    ctx.stateForBackButton = "recipeviewer";
    $("#bRecipeEditor").attr("data-id", idx);
    $("#currentServingSize").val(recipe.servings);
    // TODO: author, url, notes
    DrawRecipe(recipe, StringToNumber(`${recipe.servings}`));
}
function DrawRecipe(recipe, servingsObj) {
    $("#ingredientViewList").html(recipe.ingredience.map((e, i) => {
        const adjustedRecipe = GetServingSizeAdjustedIngredient(e, recipe.servings, servingsObj);
        return `<li data-id="${i}" class="viewIngredient">
            <span>${GetDisplayNumber(adjustedRecipe.fraction === undefined ? new Fraction(adjustedRecipe.amount) : new Fraction(adjustedRecipe.fraction))}${adjustedRecipe.unit === "" ? "" : ` ${adjustedRecipe.unit}`} ${adjustedRecipe.ingredient}</span>
        </li>`}).join(""));
    $("#stepViewList").html(recipe.steps.map((e, i) => `
    <li data-id="${i}" class="viewStep">
        <span>${i + 1}. ${AdjustStep(e.step, recipe.servings, servingsObj)}</span>
    </li>`).join(""));
}
function EditRecipe(idx) {
    const recipe = dbData.dbList[dbData.currentScreen].data[idx];
    $(".body, #menuBtn, #menuRight, #recipeRead, #recipeTopBtns").hide();
    $("#bRecipeEditor, #backBtn, #recipeEdit").show();
    $("#title").text(recipe.name);
    ctx.stateForBackButton = "recipeeditor";
    $("#bRecipeEditor").attr("data-id", idx);
    $("#recipeServingSize").val(recipe.servings);
    $("#ingredientEditList").html(recipe.ingredience.map((e, i) => `
    <li data-id="${i}" class="editIngredient">
        <span>${e.amount}${e.unit === "" ? "" : ` ${e.unit}`} ${e.ingredient}</span>
        <i class="material-icons recipeEditBtn recipeEdit">edit</i>
        <i class="material-icons recipeEditBtn recipeDel">delete</i>
    </li>`).join(""));
    $("#stepEditList").html(recipe.steps.map((e, i) => `
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
    ViewRecipe(idx);
    // TODO: recipe click
    console.log(e);
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
    if(newServingSizeObj.fraction.equals(baseServingSize)) { return ingredient; }
    const oldAmt = new Fraction(ingredient.amount);
    const newAmt = oldAmt.mul(newServingSizeObj.fraction).div(baseServingSize);
    const newUnitAndAmount = AdjustUnitToNewAmount(ingredient.unit, oldAmt, newAmt, ingredient.isLiquid);
    const newIngredient = new Ingredient(ingredient.ingredient, newUnitAndAmount.amount, newUnitAndAmount.unit, ingredient.isLiquid);
    newIngredient.checked = ingredient.checked;
    return newIngredient;
}
function AdjustUnitToNewAmount(unit, oldAmount, newAmount, isLiquid) {
    const obj = { unit: unit, amount: newAmount };
    if(["", "pinch", "dash"].indexOf(unit) >= 0 || newAmount == oldAmount) { return obj; }
    if(newAmount.compare(oldAmount) > 0) {
        if(["gal", "L", "lb", "kg", "m", "ft"].indexOf(unit) >= 0) {
            return obj; // these are already the largest units of their type
        }
    } else {
        if(["tsp", "fl oz", "mL", "oz", "mg", "mm", "in"].indexOf(unit) >= 0) {
            return obj; // these are already the smallest units of their type
        }
    }
    switch(unit) {
        // Volume - Imperial
        case "tsp": return ShiftFromTsp(newAmount, isLiquid);
        case "tbsp": return ShiftFromTsp(newAmount.mul(3), isLiquid);
        case "fl oz": return ShiftFromTsp(newAmount.mul(6), true);
        case "cup": return ShiftFromTsp(newAmount.mul(48), isLiquid);
        case "qt": return ShiftFromTsp(newAmount.mul(192), true);
        case "gal": return ShiftFromTsp(newAmount.mul(768), true);
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
function ShiftFromTsp(amount, isLiquid) {
    if(amount < 3) { return { unit: "tsp", amount: amount }; }
    if(amount < 12) { return { unit: "tbsp", amount: amount.div(3) } };
    if(isLiquid) {
        if(amount < 16) { return { unit: "fl oz", amount: amount.div(6) }; }
        if(amount < 192) { return { unit: "cup", amount: amount.div(48) }; }
        if(amount < 768) { return { unit: "qt", amount: amount.div(192) }; }
        return { unit: "gal", amount: amount.div(768) };
    } else {
        return { unit: "cup", amount: amount.div(48) };
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
        case "ºF": return { unit: "ºC", amount: amount.add(-32).mul(5, 9) };
        case "ºC": return { unit: "ºF", amount: amount.mul(9, 5).add(32) };
        case "oz":
            if(amount >= 35.274) { return { unit: "kg", amount: amount.div(35.274) }; }
            else { return { unit: "g", amount: amount.mul(28.35) }; }
        case "lb":
            if(amount >= 2.205) { return { unit: "kg", amount: amount.div(2.205) }; }
            else { return { unit: "g", amount: amount.mul(453.592) }; }
        case "g":
            if(amount > 453.592) { return { unit: "lb", amount: amount.div(453.592) }; }
            else { return { unit: "oz", amount: amount.div(28.35) }; }
        case "kg":
            if(amount > 2.205) { return { unit: "lb", amount: amount.mul(2.205) }; }
            else { return { unit: "oz", amount: amount.div(35.274) }; }
    }
    return { unit: unit, amount: amount };
}

function AdjustStep(step, baseServingSize, newServingSizeObj) {
    return step.replace(/\[(~?)([0-9]+(?:(?:\.|\/|,)[0-9]+)?)(?:[ º])?([A-Za-z ]*)]/g, function(whole, tilde, number, unit) {
        const originalAmount = StringToNumber(number);
        unit = CleanUserUnit(unit);
        const newAmount = originalAmount.fraction.mul(newServingSizeObj.fraction).div(baseServingSize);
        const finalUnitAndAmount = AdjustUnitToNewAmount(unit, originalAmount.fraction, newAmount, false); // TODO: isLiquid
        const isConvertible = ["tbsp", "tsp", "cup", ""].indexOf(finalUnitAndAmount.unit) < 0; // can't determine if liquid or solid
        return GetAdjustableStepIngredientHTML(finalUnitAndAmount.amount, finalUnitAndAmount.unit, tilde, isConvertible);
    });
}
function GetAdjustableStepIngredientHTML(amount, unit, tilde, isConvertible) {
    amount = amount.round(5);
    const showAsFraction = amount.d <= 10;
    const amountToStore = showAsFraction ? amount.toFraction() : amount.toString();
    let amountToShow = GetDisplayNumber(amount, showAsFraction);
    if(isConvertible) {
        return `<span class="step-unit" data-tilde="${tilde}" data-amount="${amountToStore}" data-unit="${unit}">${tilde}${amountToShow}${GetUnitDisplay(unit, amount)}</span>`;
    } else {
        return `<span>${tilde}${amountToShow}${GetUnitDisplay(unit, amount)}</span>`;
    }
}
function GetUnitDisplay(unit, amount) {
    if(unit === "") { return " "; }
    if(["ºF", "ºC"].indexOf(unit) >= 0) { return unit; }
    if(unit === "cup") { return amount.compare(1) === 0 ? " cup" : " cups"; }
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