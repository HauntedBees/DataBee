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
        const amt = $("#txtModalAmount").val();
        if(amt === "") {
            $("#txtModalAmount").addClass("comeOn");
            return;
        } else if(!IsValidNumberString(amt)) {
            $("#txtModalAmount").addClass("comeOn").val("Integer, decimal, or fraction.").focus().select();
            return;
        }
        const unit = $("#ddlModalUnit").val();
        const ingredient = new Ingredient(ing, amt, unit);

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
        if(actualVal.type === "decimal") {
            if(dir > 0) {
                if(actualVal.whole) {
                    actualVal.value += 1;
                } else {
                    actualVal.value = Math.ceil(actualVal.value);
                }
                actualVal.str = `${actualVal.value}`;
            } else {
                if(actualVal.value === 1) {
                    actualVal = StringToNumber("1/2");
                } else if(actualVal.value < 1) {
                    actualVal = StringToNumber("1/4");
                } else if(actualVal.whole) {
                    actualVal.value -= 1;
                    actualVal.str = `${actualVal.value}`;
                } else {
                    actualVal.value = Math.floor(actualVal.value);
                    actualVal.str = `${actualVal.value}`;
                }
            }
        } else if(actualVal.type === "fraction") {
            if(dir > 0) {
                actualVal = StringToNumber(`${Math.ceil(actualVal.value)}`);
            } else if(actualVal.val > 1) {
                actualVal = StringToNumber(`${Math.floor(actualVal.value)}`);
            } else if(actualVal.val === 1) {
                actualVal = StringToNumber("1/2");
            } else {
                actualVal = StringToNumber("1/4");
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
        if(actualValue.value > 0) {
            CalibrateIngredientAmounts(recipe, StringToNumber(currentVal));
        } else {
            $("#currentServingSize").addClass("comeOn");
            $("#currentServingSize").val(recipe.servings);
            alibrateIngredientAmounts(recipe, StringToNumber(`${recipe.servings}`));
        }
    });
    $("#recipeViewEdit").on("click", function() {
        const recipeIdx = parseInt($("#bRecipeEditor").attr("data-id"));
        EditRecipe(recipeIdx);
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
            <span>${Round(adjustedRecipe.amount)}${adjustedRecipe.unit === "" ? "" : ` ${adjustedRecipe.unit}`} ${adjustedRecipe.ingredient}</span>
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
    const origString = str;
    const isApproximate = str[0] === "~";
    if(isApproximate) { str = str.substring(1); }
    if(str.indexOf("/") > 0) { // fraction
        const vals = str.split("/");
        const numerator = parseInt(vals[0]);
        const denominator = parseInt(vals[1]);
        return {
            type: "fraction", approx: isApproximate, str: origString,
            numerator: numerator,
            denominator: denominator,
            value: numerator / denominator
        };
    }
    if(str.indexOf(",") >= 0) { // decimal from countries that use commas I guess
        str = str.replace(/,/g, ".");
    }
    return {
        type: "decimal", approx: isApproximate, str: origString,
        value: parseFloat(str), whole: str.indexOf(".") < 0
    };
}
function GetServingSizeAdjustedIngredient(ingredient, baseServingSize, newServingSizeObj) {
    if(baseServingSize === newServingSizeObj.value) { return ingredient; }
    let newAmt = 0;
    if(newServingSizeObj.type === "decimal") {
        newAmt = ingredient.amount * newServingSizeObj.value / baseServingSize;
    } else {
        newAmt = ingredient.amount * newServingSizeObj.numerator / (baseServingSize * newServingSizeObj.denominator);
    }
    const newUnitAndAmount = AdjustUnitToNewAmount(ingredient.unit, ingredient.amount, newAmt);
    const newIngredient = new Ingredient(ingredient.ingredient, newUnitAndAmount.amount, newUnitAndAmount.unit);
    newIngredient.checked = ingredient.checked;
    return newIngredient;
}
function AdjustUnitToNewAmount(unit, oldAmount, newAmount) {
    const obj = { unit: unit, amount: newAmount };
    if(["", "pinch", "dash"].indexOf(unit) >= 0 || newAmount == oldAmount) { return obj; }
    if(newAmount > oldAmount) {
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
        case "tsp": return ShiftFromTsp(newAmount);
        case "tbsp": return ShiftFromTsp(newAmount * 3);
        case "fl oz": return ShiftFromTsp(newAmount * 6, true);
        case "cup": return ShiftFromTsp(newAmount * 48);
        case "qt": return ShiftFromTsp(newAmount * 192, true);
        case "gal": return ShiftFromTsp(newAmount * 768, true);
        // Volume - Metric
        case "mL": return ShiftFromMilliliter(newAmount);
        case "dL": return ShiftFromMilliliter(newAmount * 100);
        case "L": return ShiftFromMilliliter(newAmount * 1000);
        // Weight - Imperial
        case "oz":
            if(newAmount >= 16) {
                return { unit: "lb", amount: newAmount / 16 };
            } else { return obj; }
        case "lb":
            if(newAmount < 1) {
                return { unit: "oz", amount: newAmount * 16 };
            } else { return obj; }
        // Weight - Metric
        case "mg": return ShiftFromMilligram(newAmount);
        case "g": return ShiftFromMilligram(newAmount * 1000);
        case "kg": return ShiftFromMilligram(newAmount * 1000000);
        // Length - Imperial
        case "in": 
            if(newAmount >= 12) {
                return { unit: "ft", amount: newAmount / 12 };
            } else { return obj; }
        case "lb":
            if(newAmount < 1) {
                return { unit: "in", amount: newAmount * 12 };
            } else { return obj; }
        // Length - Metric
        case "mm": return ShiftFromMillimeter(newAmount);
        case "cm": return ShiftFromMillimeter(newAmount * 10);
        case "m": return ShiftFromMillimeter(newAmount * 1000);
    }
    return obj;
}
function ShiftFromTsp(amount, liquidOkay) {
    if(amount < 3) { return { unit: "tsp", amount: amount }; }
    if(liquidOkay && amount < 16) {
        return { unit: "fl oz", amount: amount / 6 };
    } else if(amount < 12) {
        return { unit: "tbsp", amount: amount / 3 };
    }
    if(liquidOkay && amount >= 192) {
        if(amount < 768) {
            return { unit: "qt", amount: amount / 192 };
        } else {
            return { unit: "gal", amount: amount / 768 };
        }
    } else {
        return { unit: "cup", amount: amount / 48 };
    }
}
function ShiftFromMilliliter(amount) {
    if(amount < 200) { return { unit: "mL", amount: amount }; }
    if(amount >= 1000) { return { unit: "L", amount: amount / 1000 }; }
    return { unit: "dL", amount: amount / 100 };
}
function ShiftFromMilligram(amount) {
    if(amount < 1000) { return { unit: "mg", amount: amount }; }
    if(amount >= 1000000) { return { unit: "kg", amount: amount / 1000000 }; }
    return { unit: "g", amount: amount / 1000 };
}
function ShiftFromMillimeter(amount) {
    if(amount < 10) { return { unit: "mm", amount: amount }; }
    if(amount >= 1000) { return { unit: "m", amount: amount / 1000 }; }
    return { unit: "cm", amount: amount / 10 };
}

function AdjustStep(step, baseServingSize, newServingSizeObj) {
    return step.replace(/\[(~?)([0-9]+(?:(?:\.|\/|,)[0-9]+)?) ?([A-Za-z ]*)]/g, function(whole, tilde, number, unit) {
        if(baseServingSize === newServingSizeObj.value) { return whole.substring(1, whole.length - 1); }
        const originalAmount = StringToNumber(number);
        unit = CleanUserUnit(unit);
        let newAmount = 0;
        if(newServingSizeObj.type === "decimal") {
            newAmount = originalAmount.value * newServingSizeObj.value / baseServingSize;
        } else {
            newAmount = originalAmount.value * newServingSizeObj.numerator / (baseServingSize * newServingSizeObj.denominator);
        }
        const finalUnitAndAmount = AdjustUnitToNewAmount(unit, originalAmount.value, newAmount);
        return `${tilde}${Round(finalUnitAndAmount.amount)} ${finalUnitAndAmount.unit}`;
    });
}
const unitSynonyms = {
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
    $("#currentServingSize").val(amount.str);
    DrawRecipe(recipe, amount);
}
function Round(n) { return Math.round(n * 1000) / 1000; }