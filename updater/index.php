<?php  
if ( $_GET["deletethiswebhookplease"] ) {
	$url ="https://api.trello.com/1/webhooks/" . $_GET["deletethiswebhookplease"] . "/?key=25b5b64e0775810adb63542a7b75f411&token=fc6fe9f57d3796636d24d77dd93403d81682bf500494552866c9445124eee8f1";


	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL,$url);
	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
	curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	$result = curl_exec($ch);
	$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	curl_close($ch);	
}


$headers = getallheaders();

if( $headers["x-trello-webhook"]) {

	$message = "";

	if($_GET['email']) {
		$email = $_GET['email'];
		$safeDomain = "/liquidweb.com$/";
		
		if(preg_match($safeDomain, $email)) {
			$to = $_GET['email'];
		} else {
			$to = "wwachs@liquidweb.com";
			$message .= "email from bad domain - $email\r\n";
			$message .= "email from bad domain - $email\r\n";
			$message .= "email from bad domain - $email\r\n";
			$message .= "email from bad domain - $email\r\n";
			#TODO attempt to delete webhook since an invalid one has been created
		}
		
	}


	$request_body = file_get_contents('php://input');
	$action = json_decode($request_body, true);


	$subject = "Trello Updated - " . $action['model']['name'];

	$message .= "A change occured on Trello that you requested to be notified about.\r\n\r\n";
	$message .= "Item Title - " . $action['model']['name'] . "\r\n";
	$message .= "Update Type - " . $action['action']['type'] . "\r\n";
	$message .= "Updated By - " . $action['action']['memberCreator']['fullName'] . "\r\n";
	$message .= "Updated On - " . $action['action']['date'] . "\r\n\r\n";
	$message .= "Link to Trello - " . $action['model']['url'] . "\r\n";
	$message .= "Link to read-only mode - http://trello.liquidweb.com/?c=" . $action['model']['id'] . "\r\n\r\n";
	$message .= "Details of the change are listed below:\r\n";

	
	$message .= print_r($action['action']['data'], true);
	$message .= "\r\n\r\n\r\nTo no longer receive updates from THIS SPECIFIC SUBSCRIPTION go to https://trello.liquidweb.com/?deletethiswebhookplease=";



	$headers = 	'From: trello@trello.liquidweb.com' . "\r\n" . 
			'Reply-To: donotreply@trello.liquidweb.com' . "\r\n" . 
			'X-Mailer: PHP/' . phpversion();


	$error = error_get_last();
	$message .= $error[message];

	if( mail($to, $subject, $message, $headers))
		print "Success";

}
?>
