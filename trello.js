$(window).load(function(){

var onAuthorize = function() {
	updateLoggedIn();
	$("#cards").empty();

	var $_GET = getQueryParams(document.location.search);

	buildHeader();
	
	if (!$_GET["s"] & !$_GET["c"] & !$_GET["b"] & !$_GET["deletewebhookid"]) {
		listBoards();
	}
	
	if ($_GET["s"]) {
		$('<span>The search feature is coming soon!</span>').appendTo('#output');	
	}

	if ($_GET["b"]) {
		displayBoard($_GET["b"]);
	}

	if ($_GET["c"]) {
		displayCard($_GET["c"]);
	}
	
	if ($_GET["deletewebhookid"]) {
		unsubscribe($_GET["deletewebhookid"]);
	}
	

};

var buildHeader = function() {
	Trello.members.get("me", function(member){
		$("#fullName").text(member.fullName);
	});

	$('<div id="formBar" style="clear:both"></div>').appendTo('#header');
	
	$('<div id="quickCard"><form method="get"><input type="text" name="c" placeholder="Card ID" /><input type="submit" value="Go"/></form></div>')
	.appendTo("#formBar");

	$('<div id="quickSearch"><form method="get"><input type="text" name="s" placeholder="Search" /><input type="submit" value="Search"/></form></div>')
	.appendTo("#formBar");

	$('<div style="clear:both"></div>').appendTo('#header');

};

var addSubscribeLink = function(modelId, desc) {
	$('<input id="emailId" type="text" placeholder="e-mail address"/>')
	.appendTo("#formBar");
	
	$('<input type="button" value="Subscribe" />')
	.click(function() {subscribe(modelId, desc, $("#emailId").val())})
	.appendTo("#formBar");
};

var subscribe = function(model, desc, email) {
	var $description = "webhook to notify " + email + " about changes to " + model + " - Desc - " + desc;
	var $callback = "https://trello.liquidweb.com/updater/?email=" + email + "&model=" + model;
	console.log($description);
	console.log($callback);

	Trello.post("webhooks", {description: $description, callbackURL: $callback, idModel: model}, 
	function() {alert("Notification added successfully");},
	function() {alert("FAIL - The notification failed to create!!!!!");}); 
};

var unsubscribe = function(hookId) {
	//This is currently totally broken due to cross site scripting permission stuff, I get an error everytime this code runs.  moving on for now

	$("<span>Attempting to delete webhook</span><br />").appendTo("#output");

	Trello.get("webhooks/" + hookId + "/",  
		function(hook) { 
			$("<span>" + hook.description + " - has been found, attempting to delete</span><br />").appendTo("#output");
			Trello.del("webhooks/" + hookId + "/",
				function(hook) { $("<span>Webhook successfully deleted!</span>").appendTo("#output"); },
				function(hook) { $("<span>WEbhook was found, but it failed to delete.  Retry, and notify someone if this continues</span>").appendTo("#output"); } );  

		 },
		function(hook) { $("#output").empty(); $("<span>Unable to locate a webhook by that ID to delete - " + hookId + "</span>").appendTo("#output"); } );
};


var displayBoard = function(boardId) {
	var $cards = $("<div>")
	.text("Loading Cards...")
	.addClass("cards")
	.appendTo("#output");

	
	Trello.boards.get(boardId,{cards:"visible", lists:"all" }, function(board) {
		//console.log(lists);
		addSubscribeLink(boardId, "Board Name - " + board.name);
		displayCards(board);
	});
};



var displayCards = function(board) {
	$("#output").empty();
	$('#output').append("<h1>" + board.name  + "</h1>");
	$('#output').append("<thead><tr><th>Card Title</th><th>List (Status)</th><th>Date Updated</th></tr></thead>");
	var lists = [];
	$.each(board.lists, function( ix, list) {
		lists[list.id] = list.name;
	}); 

	var cardCount = board.cards.length;
	for (var i=0; i<cardCount; i++) {
		//console.log(results.cards[i]);
		var c = board.cards[i];
			var row = "<tr>";
			row = row + "<td><a href='/?c=" + c.id + "'>" + c.name + "</a></td>";
			row = row + "<td>" + lists[c.idList] + "</td>";
			row = row + "<td>" + c.dateLastActivity + "</td>";
			row = row + "</tr>";
			$('#output').append(row);
	}
}

var displayResultsBoard = function(board) {
	$("#output").empty();
	$('#output').append("<h1>Board List</h1>");
	$('#output').append("<thead><tr><th>Board Name</th></tr></thead>");

	var boardCount = board.length;
	for (var i=0; i<boardCount; i++) {
		//console.log(results.cards[i]);
		var b = board[i];
			var row = "<tr>";
			row = row + "<td><a href='/?b=" + b.id + "'>" + b.name + "</a></td>";
			row = row + "</tr>";
			$('#output').append(row);
	}
}




var listBoards = function() {
	var $boards = $("<div>")
	.text("Loading Boards...")
	.appendTo("#output");


	Trello.get("member/me/boards",{filter: "open"}, function(boards) {
			displayResultsBoard(boards);
	});
};




var displayCard = function(cardId) {
	var $details = $("<div>")
	.text("Loading Card Details...")
	.addClass("cardDetails")
	.appendTo("#output");


	Trello.cards.get(cardId,{board:"true",list:"true",checklists: "all",actions: "commentCard,createCard", action_memberCreator_fields : "fullName"}, function(cards) {
		$details.empty()
		
		addSubscribeLink(cards.id, "Card Title - " + cards.name);

		var $detailHeader = $("<div>")
		.addClass("cardDetailHeader")
		.appendTo($details);

		$("<h1>")
		.text(cards.name)
		.attr("id", "cardTitle")
		.appendTo($detailHeader);

		$("<a>")
		.text(cards.name)
		.attr("href", "http://www.trello.com/c/" + cards.id)
		.text("Open card in Trello")
		.appendTo($detailHeader);

		$('<br /><br />')
		.appendTo($detailHeader);

		$("<a>")
		.addClass("cardBoard")
		.attr('href', '/?b=' + cards.board.id)
		.text('Board - ' + cards.board.name)
		.appendTo($detailHeader);

		$("<span>")
		.addClass("cardList")
		.text('List (status) - ' + cards.list.name)
		.appendTo($detailHeader);

		$("<h3>")
		.text(cards.desc)
		.attr("id", "cardDesc")
		.appendTo($detailHeader);

		var $checklists = $("<div>")
		.addClass("cardChecklists")
		.appendTo($details);

		var $comments = $("<div>")
		.addClass("cardComments")
		.appendTo($details);

		$.each(cards.checklists, function (ix, checklist) {
			var $checklist = $("<div>")
			.addClass("checklist")
			.appendTo($checklists);
			
			$("<h4>")
			.addClass("checklistTitle")
			.text(checklist.name)
			.appendTo($checklist);

			var $items = $("<ul>")
			.addClass("checklistItems")
			.appendTo($checklist);

			$.each(checklist.checkItems, function(ix, item) {
				var $item = $("<li>")
				.addClass("checklistItem")
				.text(item.name)
				.appendTo($items);

				if (item.state == "complete") {
					$item.addClass("strikethrough");
				}
				
			});
			
		});

		$.each(cards.actions, function (ix, action) {
			if (action.type == "createCard") {
				$("<span>")
				.addClass("cardCreator")
				.text('Created by - ' + action.memberCreator.fullName)
				.appendTo($detailHeader);

				$("<span>")
				.addClass("cardDate")
				.text('Created on - ' + action.date)
				.appendTo($detailHeader);
			}

			if (action.type == "commentCard") {
				var $comment = $("<div>")
				.addClass("comment")
				.appendTo($comments);
					
				$("<span>")
				.addClass("commentUser")
				.text(action.memberCreator.fullName)
				.appendTo($comment);

				$("<span>")
				.addClass("commentDate")
				.text(action.date)
				.appendTo($comment);

				$("<span>")
				.addClass("commentText")
				.text(action.data.text)
				.appendTo($comment);
			}
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
