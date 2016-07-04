$(function () {
    $("#searchinput").keyup(function () {
        var sv = $(this).val();
        var timer = null;
        if (timer)
            clearTimeout(timer);
        timer = setTimeout(function () {
            search(sv);
        },500);
    });
});
function search(s) {
    $(".upload_item div.file_name").each(function (i, opt) {
        var name = $(this).data("name");
        var key = $(this).data("key");
        $("#" + key).show();
        if (name.indexOf(s) == -1)
            $("#" + key).hide();
    });
}