(function(){
	var WIDTH = { 'y': 50, 't': 50, 'g': 100, 'l': 200, 'm': 600 };
	var $temp = {};

	$(document).ready(function(){
    $("#worddb-go").on('click', function(e){
      $.get("/managewordyeah/word?id=" + $("#worddb-_id").val()+"&lang="+$("db-lang").val(), function(res){
        var $table = $("#worddb-data").empty();
        var $r;
        $("#worddb-selected-_id").text(res._id);

        res.list.forEach(function(item){
          $table.append($r = $("<tr>"));
          $r
            .append($("<td>").append(putterc("worddb-item-type", 'g', item.type)))
            .append($("<td>").append(putterc("worddb-item-mean", 'l', item.mean )))
            .append($("<td>").append(putterc("worddb-item-flag", 'l', item.flag)))
            .append($("<td>").append(putterc("worddb-item-theme", 'l', item.theme)))
        });
      });
    });
  });
	function putterc(id, w, value){
		return $("<input>").attr('class', id).css('width', WIDTH[w]).val(value);
	}
	function putter(id, w, value){
		return $("<input>").attr('id', id).css('width', WIDTH[w]).val(value);
	}
})();
