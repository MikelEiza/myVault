// global variables
// TOOD: this should be made in better way :-)
var VAULT_URL = "http://10.10.0.149:9200/v1/";
var DEFAULT_SECRET_PATH = "/secret/";
var EFFECT_TIME= 200;
var path_array = [];

// end global variables

function login(){
    var username = document.getElementById("username").value;
    var pass = document.getElementById("inputPassword").value;

    var password = {password:pass};
    $.ajax({
        type: "POST",
        data :JSON.stringify(password),
        url: VAULT_URL+"auth/ldap/login/"+username,
        contentType: "application/json",
        dataType: "json",
    }).done(function(res) {
        window.location.href = "/";
        localStorage.setItem("ironvault-token", res.auth.client_token);
    }).fail(function(jqXHR, textStatus, errorThrown){
        $('#log_error').html(textStatus+" "+errorThrown);
        $('#log_error').slideDown().delay(1500).slideUp();
    });

}

function get_token(){
    return localStorage.getItem("ironvault-token");
}

function get_path(){
    var params = window.location.search.substring(1).split("=");
    if (params[0] == "path"){
        return params[1];
    } else {
        return ""
    }
}

function logout(error){
    localStorage.removeItem('ironvault-token');
    window.location.href = "/login.html#"+error;
}

function is_logged(){
    if(window.location.search.substring(1) == "logout"){
        // we force logout if there's in the URL
        localStorage.removeItem("ironvault-token");
    }
    var token = get_token();
    if (!token){
        if (window.location.pathname != "/login.html"){
            window.location.href = "/login.html";
        }
    } else {
        if (window.location.pathname == "/login.html"){
            window.location.href = "/";
        } else {
            $("ul li a#is_logged").html("Logout");
            $("ul li a#is_logged").attr("href", "/login.html?logout");

            var path = get_path();
            if (path.length > 0) {
                if (path.substring(path.length-1) == "/"){
                    // we're in a directory
                    browse_secrets(path);
                } else {editormd
                    get_secret(path);
                }
            } else {
                browse_secrets(DEFAULT_SECRET_PATH);
            }
        }
    }
    var data = get_tree(DEFAULT_SECRET_PATH);

    $(document).ready(function($) {
        setTimeout(function() {
            $('#tree').delay(1000).treeview({
               data:data,
               levels:1,
               color: "#2e2d30",
               selectedBackColor: "#b0232a",
               enableLinks:true,
               expandIcon: "fa fa-plus",
               collapseIcon: "fa fa-minus",
            //    onNodeSelected: function(event, node) {
            //        window.location.href = "/?path="+path+node.text;
            //       }
            });
        }, 400);
    });






}

function print_errors(){
    var errors = window.location.hash.substring(1);
    if (errors){
        $("#log_error").slideDown();
    }
    $('#log_error').html(errors);
}

function get_tree(path){
    var token = get_token();
    var items = []
    $.ajax({
        type: "LIST",
        async: true,
        crossDomain: true,
        headers: {"X-Vault-Token": token},
        url: VAULT_URL+path.substring(1),
        contentType: "application/json",
        dataType: "json",
        statusCode: {
            200: function (response, textStatus, errorThrown) {
            },
         },
    }).always(function(response){
        $.each(response.data.keys.sort(),function(index,value){
            item = {};
            item["text"] = value;
            item["href"] = "/?path="+path+value;

            if (value.substring(value.length-1) == "/"){
                item["nodes"] = [];
                var sub_items = get_tree(path+value);
                item["nodes"] = sub_items;
            }
            items.push(item);
        })
    });
    return items
}

function set_tree(path,data) {
    var tree = [];

    if (data == ""){
        // we are in a secret
        var item = {};
        var path_array = path.split("/");
        item["text"] = path_array[path_array.length-1];
        item["href"] = "/?path="+path;
        item["state"] = {selected:true}
        tree.push(item);
    } else {
        $.each(data.sort(),function(index,value){
            item = {};
            if (value.substring(value.length-1) == "/"){
                item["icon"] = "fa fa-plus ";
                item["selectedIcon"] = "fa fa-minus";
            }
            item["text"] = value;
            item["href"] = "/?path="+path+value;
            tree.push(item);
        });
    }

    $('#tree').treeview({
       data:tree,
       levels:5,
       color: "#2e2d30",
       selectedBackColor: "#b0232a",
       enableLinks:true,
       onNodeSelected: function(event, node) {
           window.location.href = "/?path="+path+node.text;
          }
    });
}

function update_breadcrumb() {
    path = get_path() || DEFAULT_SECRET_PATH;
    $("#create_secret_path").html(path);
    var path = path.substring(1);
    if (path.indexOf("&")>0){
        var params= path.split("&")
        path = params[0];
    }
    var complete_path="/?path=";
    $("#secret_path").empty();
    var i = 0;
    var total = path.split("/").length-1;
    $.each(path.split("/"),function(index,value){
        complete_path=complete_path+"/"+value;
        var folder="";
        if (i < total){
            folder = "/";
        }
        $("#secret_path").append(
            $("<li>").attr("class","breadcrumb-item").append(
                $("<a>").attr("href",complete_path+folder).html(value)
            )
        );
        i++;
    });
}

function print_secret(data){
    var mywindow = window.open('', 'new div', 'height=400,width=600');
    mywindow.document.write('<html><head><title></title>');
    mywindow.document.write('<link rel="stylesheet" href="deps/editor.md/css/editormd.min.css">');
    mywindow.document.write('</head><body>');
    mywindow.document.write('<div class="markdown-body editormd-html-preview">');
    mywindow.document.write(data);
    mywindow.document.write('</div>');
    mywindow.document.write('</body></html>');
    setTimeout(function(){
        //FIXME: if not delayed, the document is not loaded
        mywindow.print();
    }, 2000);

}

function set_secret(action,data,create){
    var token = get_token();
    var path = "";
    if (action == "created"){
        path = $("#create_secret_path").html()+$("#new_secret_name").val();
    } else {
        path = get_path();
        if (path.indexOf("&")>0){
            var params= path.split("&")
            path = params[0];
        }
    }
    var item = {}
    item["ironvault"] = "markdown";
    item["data"] = data;

    $.ajax({
        type: "PUT",
        headers: {"X-Vault-Token": token},
        url: VAULT_URL+path,
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(item),
        statusCode: {
            204: function (response, textStatus, errorThrown) {
                $("#log_success").html("Secret has been "+action).slideDown().delay(1500).slideUp();
                if (create){
                    window.location.href = "/?path="+path+"&edit=1";
                }
            },
            400: function (response, textStatus, errorThrown) {
                $("#log_error").html("Secret has NOT been "+action+"<br/><br/>ERROR: "+errorThrown);
                $("#log_error").slideDown().delay(2500).slideUp();
            },
            403: function (response, textStatus, errorThrown){
                logout(textStatus+" "+errorThrown);
            },
        },
    });

}

function get_secret(){
    var token = get_token();
    var path = get_path();
    var edit = false;
    if (path.indexOf("&")>0){
        var params= path.split("&")
        path = params[0];
        if (params[1].split("=")[0] == "edit"){
            edit = true
        }
    }
    if (path.substring(path.length-1) == "/"){
        // we're in a directory
        browse_secrets(path);
    } else if (path.length > 0) {
        $.ajax({
            type: "GET",
            headers: {"X-Vault-Token": token},
            url: VAULT_URL+path.substring(1),
            contentType: "application/json",
            dataType: "json",
            statusCode: {
                200: function (response, textStatus, errorThrown) {
                    $("#editors").slideDown(EFFECT_TIME);
                    update_breadcrumb();

                    $("#editormd textarea").text(response.data["data"]);

                    var editormarkdown = "";
                    if (edit) {
                        var editormarkdown = "";
                        $("#functions_buttons").empty(); // hide/empty buttons

                        editormarkdown = editormd({
                            id                 : "editormd",
                            width              : "100%",
                            path               : "deps/editor.md/lib/",
                            height             : 800,
                            mode               : "gfm", // https://codemirror.net/mode/gfm/
                            tocm               :true,
                            codeFold           : true,
                            // saveHTMLToTextarea : true,
                            searchReplace      : true,
                            autoCloseTags      : true,
                            htmlDecode         : "style,script,iframe",
                            emoji              : true,
                            taskList           : true,
                            tex                : true,
                            flowChart          : true,
                            sequenceDiagram    : true,
                            toolbarAutoFixed   : false,
                            toolbarIcons : function(){
                                return ["undo", "redo", "|",
                                    "bold", "del", "italic", "quote", "|",
                                    "h1", "h2", "h3", "h4", "h5", "h6", "|",
                                    "list-ul", "list-ol", "hr", "|",
                                    "link", "reference-link", "image", "code",
                                    "preformatted-text", "code-block",
                                    "table", "emoji", "pagebreak", "|",
                                    "watch", "preview", "search", "fullscreen"
                                ]
                            },
                            onload : function() {
                                // Awesome hack to add "save" option :D
                                $("ul.editormd-menu")
                                    .prepend(
                                        '<li><a href="javascript:;" id="editor_update_secret_btn" title="Save" unselectable="on">\
                                        <i class="fa fa-floppy-o" unselectable="on"></i></a></li>');
                                $("#editor_update_secret_btn").click(function(){
                                    set_secret("updated",editormarkdown.getMarkdown(),false);
                                });
                            },

                        });
                    } else {
                        // just show the secret
                        editormarkdown = editormd.markdownToHTML("editormd", {
                            height             : 800,
                            mode               : "gfm", // https://codemirror.net/mode/gfm/
                            tocm               : true,
                            tocTitle           : "TOCM",
                            htmlDecode         : "style,script,iframe",
                            emoji              : true,
                            taskList           : true,
                            tex                : true,
                            flowChart          : true,
                            sequenceDiagram    : true,
                        });
                    }

                },
                403: function (response, textStatus, errorThrown){
                    logout(textStatus+" "+errorThrown);
                },
                404: function(response, textStatus, errorThrown){
                    $('#log_error').html("Secret not found").slideDown().delay(2500).slideUp();
                    $("#editors").slideUp(EFFECT_TIME);
                },
            },
        });
    }
}

function browse_secrets(path){
    var token = get_token();
    var path_array = [];
    $("#editors").slideUp(EFFECT_TIME);
    $("#create_secret").show();
    $.ajax({
        type: "LIST",
        headers: {"X-Vault-Token": token},
        timeout: 1000,
        url: VAULT_URL+path.substring(1),
        contentType: "application/json",
        dataType: "json",
        statusCode: {
            200: function (response, textStatus, errorThrown) {
                // set_tree(path,response.data.keys);
                // get_tree(DEFAULT_SECRET_PATH);
                update_breadcrumb();
            },
            403: function (response, textStatus, errorThrown){
                logout(textStatus+" "+errorThrown);
            },
            404: function (response, textStatus, errorThrown) {
                $('#log_error').html("Path not found").slideDown().delay(2500).slideUp();
            }
         },
    }).always( function(response,textStatus,errorThrown) {
        if (textStatus == "timeout"){
            logout("timeout");
        }
    });
}

$(document).ready(function(){
    $("#login").click(function(){
        login();
    });

    $("#create_secret_btn").click(function(){
        set_secret("created","",true);
    });

    $("#edit_secret_btn").click(function(){
        var path = get_path();
        window.location.href = "/?path="+path+"&edit=1";
    });

    $("#print_secret_btn").click(function(){
        print_secret($("#editormd").html());
    });

});
