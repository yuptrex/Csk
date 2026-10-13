/* ============ GOOGLE SIGN-IN (single place for all Google auth logic) ============
   Tap "Sign in with Google" -> Google's own account chooser opens in a popup window
   (prompt=select_account, so it always lists the accounts on the device and offers "Use another account").
   Pick an account -> the popup closes and Firebase Auth signs this tab in.

   Everything else (login.js, game.js) just calls CSKGoogle.signIn(auth); nothing else touches the Google provider.

   IMPORTANT: signIn() must be called straight from the tap/click handler (no await before it), otherwise
   browsers treat the popup as unrequested and block it.

   Result of signIn():  {user}         signed in (popup flow)
                        {cancelled}    the person closed the Google window without choosing
                        {redirecting}  the browser blocked the popup, so the page is being sent to Google instead
                                       (the result is picked up by CSKGoogle.redirectResult() on the next load)
   Any other failure rejects with the Firebase error (e.code = 'auth/...'). */
(function(){
'use strict';
var CANCEL={'auth/popup-closed-by-user':1,'auth/cancelled-popup-request':1,'auth/user-cancelled':1};

function provider(){
 var p=new firebase.auth.GoogleAuthProvider();
 p.setCustomParameters({prompt:'select_account'});   /* always show the account chooser */
 return p}

function isCancel(e){return !!(e&&CANCEL[e.code])}

function signIn(auth){
 var p;
 try{p=provider();return auth.signInWithPopup(p).then(function(r){return {user:r&&r.user}},function(e){
  if(isCancel(e))return {cancelled:true};
  if(e&&e.code==='auth/popup-blocked'){   /* e.g. in-app browsers: fall back to a full-page trip to Google */
   return auth.signInWithRedirect(p).then(function(){return {redirecting:true}})}
  throw e})}
 catch(e){return Promise.reject(e)}}

/* call once after Firebase Auth is created: completes a redirect sign-in (only used after a blocked popup) */
function redirectResult(auth){
 try{return auth.getRedirectResult().catch(function(e){if(isCancel(e))return null;throw e})}
 catch(e){return Promise.resolve(null)}}

window.CSKGoogle={signIn:signIn,redirectResult:redirectResult,isCancel:isCancel};
})();
