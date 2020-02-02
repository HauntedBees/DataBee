const online = {
    GetBackupFromURL: url => online.DoAJAX(url, data.ProcessBackupJSON),
    GetListFromURL: url => online.DoAJAX(url, data.ProcessListJSON),
    GetRecipeFromURL: url => online.DoAJAX(url, data.ProcessRecipeJSON),
    DoAJAX: function(url, callback) {
        $.ajax({
            type: "GET", url: url, datatype: "jsonp",
            xhrFields: { withCredentials: true },
            success: function(s) {
                if(s === "") {
                    ShowAlert("URL Error", "Website returned no response. Make sure you specified a valid URL.");
                    return;
                }
                try {
                    callback(s);
                } catch {
                    ShowAlert("Format Error", "Website returned response in an invalid format. Make sure you specified a valid URL.");
                }
            },
            error: function(e) {
                console.log(e);
                ShowAlert("URL Error", "Call returned an error. Make sure you specified a valid URL.");
            }
        });
    }
};