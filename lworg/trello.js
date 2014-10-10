$(window).load(function(){

var onAuthorize = function() {
	updateLoggedIn();
	$("#cards").empty();

	var $_GET = getQueryParams(document.location.search);

	buildHeader();
	
	if (!$_GET["s"] & !$_GET["c"] & !$_GET["b"] & !$_GET["deletewebhookid"] & !$_GET["fixlinks"]) {
		listBoards();
	}
	
	if ($_GET["s"]) {
		displaySearch($_GET["s"]);
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

	if ($_GET["fixlinks"]) {
		fixSnapshotLinks($_GET["fixlinks"]);
	}
	

};

var buildHeader = function() {
	Trello.members.get("me", function(member){
		$("#fullName").text(member.fullName);
	});
	
	$('<div id="quickCard" class="quickForm"><form method="get" class="form-inline"><div class="input-group"><input type="text" name="c" class="form-control" placeholder="Card ID" /><span class="input-group-btn"><button type="submit" class="btn btn-default">Go</button></span></div></form></div>')
	.appendTo("#formBar");

	$('<div id="quickSearch" class="quickForm"><form method="get" class="form-inline"><div class="input-group"><input type="text" name="s" class="form-control" placeholder="Search" /><span class="input-group-btn"><button type="submit" class="btn btn-default">Search</button></span></div></form></div>')
	.appendTo("#formBar");

};

var addSubscribeLink = function(modelId, desc) {
	$('<div class="quickForm"><form class="form-inline"><div id="subscribeLink" class="input-group"><input id="emailId" type="email" class="form-control" placeholder="e-mail address"/></div></form></div>')
	.appendTo("#formBar");
	
	$('<span class="input-group-btn"><button class="btn btn-default">Subscribe</button></span>')
	.click(function(event) {event.preventDefault(); subscribe(modelId, desc, $("#emailId").val())})
	.appendTo("#subscribeLink");
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


var displaySearch = function(query) {
	var $cards = $("<div>")
	.text("Loading Cards...")
	.addClass("cards")
	.appendTo("#output");

	var orgboardlist = "";

	//fetch the list of open boards, then only search for cards on those boards

	Trello.get("organizations/lwrandd/boards/", {filter:"open", fields:"name"}, function(results) {
		console.log(orgboardlist);
		for(index = 0; index < results.length; ++index) {
			orgboardlist =  orgboardlist +  results[index].id + ",";
		}
		orgboardlist = orgboardlist.slice(0,orgboardlist.length-1);
		console.log(orgboardlist);
	
		Trello.get("search/",{query:query, idBoards:orgboardlist, boards_limit:"1000", cards_limit:"1000", card_list:"true", card_board:"true", partial:"true"}, function(results) {
			displayResults(results);
		});
	});
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


var displayResults = function(results) {
	$("#output").empty();
	$('#output').append("<h1>Search Results</h1>");
	$('#output').append("<table class='table table-striped table-bordered'><thead><tr><th>Card Title</th><th>Description</th><th>Board</th><th>List (Status)</th><th>Date Updated</th></tr></thead></table>");

	var cardCount = results.cards.length;
	for (var i=0; i<cardCount; i++) {
		//console.log(results.cards[i]);
		var c = results.cards[i];
			var row = "<tr>";
			row = row + "<td class='title'><a href='/?c=" + c.id + "'>" + c.name + "</a></td>";
			row = row + "<td>" + c.desc + "</td>";
			row = row + "<td><a href='/?b=" + c.board.id + "'>" + c.board.name + "</a></td>";
			row = row + "<td>" + c.list.name + "</td>";
			var date = new Date(c.dateLastActivity);
			row = row + "<td class='date'>" + date.toLocaleDateString() + ' ' + date.toLocaleTimeString() + "</td>";
			row = row + "</tr>";
			$('.table').append(row);
	};
};


var displayCards = function(board) {
	$("#output").empty();
	$('#output').append("<h1>" + board.name  + "</h1>");
	$('#output').append("<table class='table table-striped table-bordered'><thead><tr><th>Card Title</th><th>List (Status)</th><th>Date Updated</th></tr></thead></table>");
	var lists = [];
	$.each(board.lists, function( ix, list) {
		lists[list.id] = list.name;
	}); 

	var cardCount = board.cards.length;
	for (var i=0; i<cardCount; i++) {
		//console.log(results.cards[i]);
		var c = board.cards[i];
			var row = "<tr>";
			row = row + "<td class='title'><a href='/?c=" + c.id + "'>" + c.name + "</a></td>";
			row = row + "<td>" + lists[c.idList] + "</td>";
			var date = new Date(c.dateLastActivity);
			row = row + "<td class='date'>" + date.toLocaleDateString() + ' ' + date.toLocaleTimeString() + "</td>";
			row = row + "</tr>";
			$('.table').append(row);
	};
};


var fixSnapshotLinks = function(cardId) {
	var cardToCheckItem = {};
	var checkItemToList = {};
	
	Trello.cards.get(cardId, {checklists: "all", fields: "checklists"}, function(results) {
		for (var i=0; i<results.checklists.length; i++) {
			for (var j=0; j<results.checklists[i].checkItems.length; j++) {
				var checkitemCard = results.checklists[i].checkItems[j].name.substr(21,8);
				cardToCheckItem[checkitemCard] = results.checklists[i].checkItems[j].id;
				checkItemToList[results.checklists[i].checkItems[j].id] = results.checklists[i].id;

				Trello.cards.get(checkitemCard, {fields: "name,shortUrl,shortLink"}, function(results) {
					var itemName = results.name + " [ [internal](https://trello.liquidweb.com/?c=" + results.id + ") ] [ [trello](" + results.shortUrl + ") ]"; 
					var listitem = cardToCheckItem[results.shortLink];
					var list = checkItemToList[listitem];
					Trello.delete("checklists/" + list + "/checkItems/" + listitem, function () {
						Trello.post("checklists/" + list + "/checkItems", {name: itemName});
					});	
				});
			}
		} 
	}); 
}




var displayResultsBoard = function(board) {
	$("#output").empty();
	$('#output').append("<h1>Board List</h1>");
	$('#output').append("<table class='table table-striped table-bordered'><thead><tr><th>Board Name</th></tr></thead></table>");

	var boardCount = board.length;
	for (var i=0; i<boardCount; i++) {
		//console.log(results.cards[i]);
		var b = board[i];
			var row = "<tr>";
			row = row + "<td><a href='/?b=" + b.id + "'>" + b.name + "</a></td>";
			row = row + "</tr>";
			$('.table').append(row);
	};
};




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



		
		$("<div>")
		.addClass("panel").addClass("panel-default").addClass("main-panel")
		.appendTo($detailHeader);
		
		$("<div>")
		.addClass("panel-heading")
		.appendTo(".main-panel");
		
		$("<a>")
		.addClass("cardBoard")
		.attr('href', '/?b=' + cards.board.id)
		.text('Board: ' + cards.board.name)
		.appendTo(".main-panel .panel-heading");

		$("<p>")
		.addClass("cardList")
		.text('List (status) - ' + cards.list.name)
		.appendTo(".main-panel .panel-heading");
		
		$("<a>")
		.text(cards.name)
		.addClass("btn").addClass("btn-primary")
		.attr("href", "http://www.trello.com/c/" + cards.id)
		.text("Open card in Trello")
		.appendTo(".main-panel .panel-heading");

		$("<div>")
		.text(cards.desc)
		.attr("id", "cardDesc")
		.addClass("lead").addClass('panel-body')
		.appendTo(".main-panel");

		var descBrs = $('#cardDesc').html().replace(/\n/g,"<br>");
		$('#cardDesc').html(descBrs)
		
		$("<div>")
		.addClass("panel-footer")
		.appendTo(".main-panel");


		var $checklists = $("<div>")
		.addClass("cardChecklists")
		.appendTo($details);

		var $comments = $("<div>")
		.append("<h3>Comments</h3>")
		.addClass("cardComments")
		.appendTo($details);

		$.each(cards.checklists, function (ix, checklist) {
			var $checklist = $("<div>")
			.addClass("checklist").addClass("panel").addClass("panel-default")
			.appendTo($checklists);
			
			$("<div>")
			.addClass("panel-heading")
			.text(checklist.name)
			.appendTo($checklist);

			var $items = $("<div>")
			.addClass("checklistItems").addClass("list-group")
			.appendTo($checklist);

			$.each(checklist.checkItems, function(ix, item) {
				var $item = $("<div>")
				.addClass("checklistItem").addClass('list-group-item')
				.append("<span class='glyphicon glyphicon-unchecked'></span>")
				.append("<span class='name'>" + item.name + "</span>")
				.appendTo($items);

				if (item.state == "complete") {
					$item.find('.name').addClass('text-muted');
					$item.find('.glyphicon')
					.removeClass('glyphicon-unchecked')
					.addClass('glyphicon-check')
				}
				
			});
			
		});

		$.each(cards.actions, function (ix, action) {
			if (action.type == "createCard") {
				$("<span>")
				.addClass("cardCreator")
				.text('Created by ' + action.memberCreator.fullName)
				.appendTo('.main-panel .panel-footer');

				var date = new Date(action.date);
				$("<span>")
				.addClass("cardDate")
				.text(' on ' + date.toLocaleDateString() + ' at ' + date.toLocaleTimeString())
				.appendTo('.main-panel .panel-footer');
			}

			if (action.type == "commentCard") {
				
				var $comment = $("<div>")
				.addClass("panel").addClass("panel-default").addClass("comment-panel")
				.appendTo($comments);
				
				var commentnobrs = $("<div>")
				.addClass("commentText")
				.addClass('panel-body')
				.text(action.data.text)
				.appendTo($comment);
				
				$comment_footer = $("<div>")
				.addClass("panel-footer")
				.appendTo($comment);
					
				$("<span>")
				.addClass("commentUser")
				.text(action.memberCreator.fullName)
				.appendTo($comment_footer);
				
				var date = new Date(action.date);
				$("<span>")
				.addClass("commentDate")
				.text(' on ' + date.toLocaleDateString() + ' at ' + date.toLocaleTimeString())
				.appendTo($comment_footer);
				
				var brs = $(commentnobrs).html().replace(/\n/g,"<br>");
				$(commentnobrs).html(brs)
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
