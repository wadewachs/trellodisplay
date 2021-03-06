$(window).load(function(){

var onAuthorize = function() {
	updateLoggedIn();
	$("#cards").empty();

	var $_GET = getQueryParams(document.location.search);

	buildHeader();
	
	if (!$_GET["l"] & !$_GET["s"] & !$_GET["c"] & !$_GET["b"] & !$_GET["opm"]  & !$_GET["deletewebhookid"]) {
		listBoards();
	}
	
	if ($_GET["l"]) {
		displayList($_GET["l"]);
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
	
	if ($_GET["opm"]) {
		getOPM($_GET["opm"]);
	}
	
	if ($_GET["deletewebhookid"]) {
		unsubscribe($_GET["deletewebhookid"]);
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

	Trello.get("search/",{query:query, boards_limit:"1000", cards_limit:"1000", card_list:"true", card_board:"true", partial:"true"}, function(results) {
		displayResults(results);
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




var displayList = function(listId) {
	var $cards = $("<div>")
	.text("Loading Cards...")
	.addClass("cards")
	.appendTo("#output");

	
	Trello.lists.get(listId,{cards:"open"}, function(results) {
		//console.log(lists);
		addSubscribeLink(listId, "List Name - " + results.name);
		displayListCards(results);
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




var displayListCards = function(list) {
	$("#output").empty();
	$('#output').append("<h1>" + list.name  + "</h1>");
	$('#output').append("<table class='table table-striped table-bordered'><thead><tr><th>Card Title</th><th>Date Updated</th></tr></thead></table>");

	var cardCount = list.cards.length;
	for (var i=0; i<cardCount; i++) {
		//console.log(results.cards[i]);
		var c = list.cards[i];
			var row = "<tr>";
			row = row + "<td class='title'><a href='/?c=" + c.id + "'>" + c.name + "</a></td>";
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
			row = row + "<td><a href='/?l=" + c.idList + "'>" + lists[c.idList] + "</a></td>";
			var date = new Date(c.dateLastActivity);
			row = row + "<td class='date'>" + date.toLocaleDateString() + ' ' + date.toLocaleTimeString() + "</td>";
			row = row + "</tr>";
			$('.table').append(row);
	};
};



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

var converter = new Showdown.converter();

console.log(converter.makeHtml('#hello markdown!'));



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
		.text('List (status) - ')
		.appendTo(".main-panel .panel-heading");

		$("<a>")
		.addClass("cardList")
		.text(cards.list.name)
		.attr('href', "/?l=" + cards.list.id)
		.appendTo(".main-panel .panel-heading");
		
		$("<a>")
		.text(cards.name)
		.addClass("btn").addClass("btn-primary")
		.attr("href", "http://www.trello.com/c/" + cards.id)
		.text("Open card in Trello")
		.appendTo(".main-panel .panel-heading");

		$("<div>")
		.html(converter.makeHtml(cards.desc))
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
				.append("<span class='name'>" + converter.makeHtml(item.name) + "</span>")
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
				.html(converter.makeHtml(action.data.text))
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


function getOPM(opmCard) {


	var opmList = "548082919b2a595cc8e43194"; //id of the snapshot list on the OPM board


 	if (opmCard == "current") {
 		Trello.lists.get(opmList, {cards:"open",card_fields:"name,pos"}, function (results) {
			var firstCard = "";
			var firstCardPos = 1600000; //arbitrarily large number
			for (i=0;i<results.cards.length;i++) {
				if (results.cards[i].pos <= firstCardPos) {
					firstCardPos = results.cards[i].pos;
					firstCard = results.cards[i].id;
				}
			}
			displayOPM(firstCard);
			//TODO implement function call to build the card list from an OPM card
		});
 	}
// 
// 	Trello.cards.get(cardId,
}

function displayOPM(opmCard) {
        $("#output").empty();
        $('#output').append("<h1>OPM</h1>");
        $('#output').append("<table class='table table-bordered'><thead><tr><th>Complete</th><th>Squad</th><th>Card Title</th><th>List (Status)</th><th>Board Name</th></tr></thead></table>");
	Trello.cards.get(opmCard, {checklists:"all"}, function (results) { 
		for (i=0;i<results.checklists.length;i++) {
			for (j=0;j<results.checklists[i].checkItems.length;j++) {
				var cardId = results.checklists[i].checkItems[j].name.substring(21,29);
				var row = "<tr id='" + cardId + "' class='" + results.checklists[i].checkItems[j].state + "'>";
				row = row + "<td>";
				row = row + "<input type='checkbox' disabled class='opmstate " + results.checklists[i].checkItems[j].state + "'"
				if (results.checklists[i].checkItems[j].state == "complete") {
					row = row + "checked";
				}
				row = row+ "></td>";
				row = row + "<td>" + results.checklists[i].name + "</td>";
				row = row + "</tr>";
				$('.table').append(row);
				
				Trello.cards.get(cardId, {fields:"shortLink,name",board:"true",board_fields:"name",list:"true",list_fields:"name"}, function(results) {
					var row = "<td><a href='/?c=" + results.shortLink + "'>" + results.name + "</a></td>";
					row = row + "<td>" + results.list.name + "</td>";
					row = row + "<td>" + results.board.name + "</td";
					$('#' + results.shortLink).append(row);
				});
			}
		}
	});
}




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
