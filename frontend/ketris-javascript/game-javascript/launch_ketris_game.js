/*
Launch the Ketris game itself.
*/
function doLaunchKetrisGameplayer() {
  console.log( "Launching Ketris Gameplayer." );

  //Attach event listeners to the mouse.
  attach_game_mouse_events();

  //Reset the global variables to default values.
  format_globals();

  //Set the canvas width to the default value.
  let playCanvasWidth = 313;
  if( isMobile == false ) {
    //If we're on desktop, double the canvas width to hold enemy play area as well.
    playCanvasWidth = 313*2;
  } else {
    //Otherwise, if we're on mobile, set the canvas width to the default, half value.
    const myKetrisCanvas = document.getElementById("myKetrisCanvas");
    const myKetrisCanvasContext = myKetrisCanvas.getContext("2d");
    myKetrisCanvasContext.canvas.width = 313;
  }

  //Request the sprite atlas from the server.
  myDOMHandles.KetrisImage.src = "ketris_media/spritesheet_mod.png";

  //Attach an event listener to await the completion of loading the spite atlas.
  myDOMHandles.KetrisImage.onload = function() {
    console.log( "Images loaded.");
    //Set the dimensions of each canvas.
    myDOMHandles.myBackgroundCanvas = document.createElement("canvas");
    myDOMHandles.myBackgroundCanvas.width = playCanvasWidth;
    myDOMHandles.myBackgroundCanvas.height = 749;

    myDOMHandles.myPlayCanvas = document.createElement("canvas");
    myDOMHandles.myPlayCanvas.width = playCanvasWidth;
    myDOMHandles.myPlayCanvas.height = 749;

    myDOMHandles.myMenuCanvas = document.createElement("canvas");
    myDOMHandles.myMenuCanvas.width = playCanvasWidth;
    myDOMHandles.myMenuCanvas.height = 749;

    myDOMHandles.myScoreCanvas = document.createElement("canvas");
    myDOMHandles.myScoreCanvas.width = 10*15;
    myDOMHandles.myScoreCanvas.height = 16;

    myDOMHandles.myEnemyScoreCanvas = document.createElement("canvas");
    myDOMHandles.myEnemyScoreCanvas.width = 10*15;
    myDOMHandles.myEnemyScoreCanvas.height = 16;

    myDOMHandles.myPlayerCanvas = document.createElement("canvas");
    myDOMHandles.myPlayerCanvas.width = 313;
    myDOMHandles.myPlayerCanvas.height = 749;

    myDOMHandles.myEnemyCanvas = document.createElement("canvas");
    myDOMHandles.myEnemyCanvas.width = 313;
    myDOMHandles.myEnemyCanvas.height = 749;

    //Buffer the background, so we don't have to rebuild it every draw.
    doComposeBackground();

    //Start the new Ketris game.
    doStartNewGame();

    //Begin the animation request sequence.
    myAnimationValues.AnimationFrameHandle =
      window.requestAnimationFrame( doManageDrawing );
  };
}


/*
End the Ketris game.
*/
function doEndKetrisGameplayer() {
  //Remove the mouse related event listeners.
  detach_game_mouse_events();

  //Stop the animation request sequence.
  cancelAnimationFrame( myAnimationValues.AnimationFrameHandle );

  //Remove the event listener for document visibility change (going
  //to other tabs, for example).
  document.removeEventListener( 'visibilitychange', on_visibility_change );

  //Get references to the game and chat interfaces.
  let game_interface = document.getElementById('game_interface');
  let chat_interface = document.getElementById('chat_interface');

  //Hide the game interface, show the chat interface.
  game_interface.style.display = "none";
  chat_interface.style.display = "flex";
}