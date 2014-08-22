$(window).load(function(){

var onAuthorize = function() {
	updateLoggedIn();
	$("#cards").empty();

	var $_GET = getQueryParams(document.location.search);

	buildHeader();
	
	printMyCards();



};

var buildHeader = function() {
	Trello.members.get("me", function(member){
		$("#fullName").text(member.fullName);
	});

};

var printMyCards = function() {
	var $cards = $("<div>")
	.text("Loading Cards...")
	.addClass("cards")
	.appendTo("#output");
	// Output a list of all of the cards that the member 
	// is assigned to
	Trello.get("members/me/", {actions:"createCard", boards:"open", actions_limit:"1000"},  function(cards) {

		$cards.empty();
		$("<span>")
		.text("Bug List")
		.appendTo($cards);

		var $trelloCardUrl = "https://www.trello.com/c/";

		$.each(cards.actions, function(ix, action) {
			var $cardUrl = $trelloCardUrl.concat(action.data.card.id);
			$("<a>")
			.attr({href: $cardUrl, target: "trello"})
			.addClass("card")
			.text(action.data.card.name)
			.appendTo($cards);
		});  
	});
};


var buildSearch = function() {
	var $boards = $("<select multiple>")
	.attr({size:"15"})
	.appendTo("#output");

	Trello.get("organization/lwrandd/boards",{filter: "open"}, function(boards) {
		$.each(boards, function(ix, board) {
			$("<option>")
			.attr({value: board.id})
			.text(board.name)
			.appendTo($boards);
		});
	});
};


function getQueryParams(qs) {
	qs = qs.split("+").join(" ");
	var params = {},
		tokens,
		re = /[?&]?([^=]+)=([^&]*)/g;

	while (tokens = re.exec(qs)) {
		params[decodeURIComponent(tokens[1])]
		= decodeURIComponent(tokens[2]);
	}

	return params;
}




var updateLoggedIn = function() {
    var isLoggedIn = Trello.authorized();
    $("#loggedout").toggle(!isLoggedIn);
    $("#loggedin").toggle(isLoggedIn);        
};
    
var logout = function() {
    Trello.deauthorize();
    updateLoggedIn();
};
                          
Trello.authorize({
    interactive:false,
    success: onAuthorize
});

$("#connectLink")
.click(function(){
    Trello.authorize({
        name: "LW Advanced Trello Search",
	type: "popup",
        success: onAuthorize
    })
});
    
$("#disconnect").click(logout);




});  
