const request = require('request');
const secret = require("./secret")

const app_twitch_client_id = secret.getTwitch_client_ID()
const app_twitch_secret = secret.getTwitch_secret()

const token_url = 'https://id.twitch.tv/oauth2/token?client_id='+app_twitch_client_id+'&client_secret='+app_twitch_secret+'&grant_type=client_credentials'
const API_ENDPOINT = 'https://api.twitch.tv/helix/'

var current_token=-1
var current_token_expire_date=-1 // in milliseconds since midnight, January 1, 1970. It must be initialize

/**
 * get twitch access token to make twitch api call
 * it handle if token is expire or not
 */
function getTwitchAccessToken(){
    let recursive_call = 0
    return new Promise((resolve,reject)=>{
        if(new Date().getTime()>current_token_expire_date){ // check if token expire     
            // you have one problem
            // getTwitchAccessToken can be call multiple time on setup so you do some weird recursive call to wait the twitch response
            if(current_token==0){
                setTimeout(()=>{
                    recursive_call++
                    if(recursive_call>20){
                        reject('too much recursive call ( timeout )')
                    }
                    getTwitchAccessToken().then((twitch_access_token)=>{
                        resolve(twitch_access_token)
                    })
                },250)
            }else{
                current_token=0
                request.post({ 
                    headers: {'content-type' : 'application/json' }, 
                    url: token_url 
                }, 
                    function(error, response, body){
                        body = JSON.parse(body)
                        if(error){
                            reject(error)
                        }else{
                            current_token=body.access_token
                            current_token_expire_date=body.expires_in+new Date().getTime()-1000 //  number in milliseconds the token expire ( ? not sure you should check twitch api documentation ) + number of milliseconds since midnight, January 1, 1970. January 1, 1970. - 1000 ( retire 1s for security ( time proccess ?) ) 
                            resolve(body.access_token)
                        }
                }); 
            }       
        }else{
            resolve(current_token)
        }
    })
}

module.exports = {

    /**
     * title is prelly clear
     * return object under this form
     * broadcaster_type  |string| 	User’s broadcaster type: "partner", "affiliate", or "".
     * description 	     |string| 	User’s channel description.
     * display_name 	 |string| 	User’s display name.
     * email 	         |string| 	User’s email address. Returned if the request includes the user:read:email scope.
     * id 	             |string| 	User’s ID.
     * login 	         |string| 	User’s login name.
     * offline_image_url |string| 	URL of the user’s offline image.
     * profile_image_url |string| 	URL of the user’s profile image.
     * type 	         |string| 	User’s type: "staff", "admin", "global_mod", or "".
     * view_count 	     | int	|   Total number of views of the user’s channel.
     * @param {*} userID 
     */
    getUser(userID){
        return new Promise((resolve,reject)=>{
            getTwitchAccessToken().then((bearer_token)=>{
                let urlToCall = API_ENDPOINT+'users?id='+userID
                request.get({ 
                    headers: {
                        'content-type' : 'application/json',
                        'Authorization': 'Bearer '+bearer_token,
                        'Client-ID' : app_twitch_client_id
                    }, 
                    url: urlToCall 
                }, 
                    function(error, response, body){
                        body = JSON.parse(body)
                        if(error){
                            reject(error)
                        }else{
                            if(body.data!=null){
                                resolve(body.data[0])
                            }else{
                                resolve(null)
                            }
                        }
                });
            }).catch((err)=>{
                reject(err)
            })
        })
    },

    /**
     * return information about the stream of a user 
     * return object under this form : 
     * status 	            |string| 	Channel’s streaming status
     * broadcaster_id 	    |string| 	Twitch User ID of this channel owner
     * broadcaster_name 	|string| 	Twitch User name of this channel owner
     * game_id 	            |string| 	Current game ID being played on the channel
     * broadcaster_language |string| 	Language of the channel
     * title 	            |string| 	Title of the stream
     * description 	        |string| 	Description of the stream
     * @param {*} streamerID 
     */
    getStream_1(streamerID){
        return new Promise((resolve,reject)=>{
            getTwitchAccessToken().then((bearer_token)=>{
                let urlToCall = API_ENDPOINT+'channels?broadcaster_id='+streamerID
                request.get({ 
                    headers: {
                        'content-type' : 'application/json',
                        'Authorization': 'Bearer '+bearer_token,
                        'Client-ID' : app_twitch_client_id
                    }, 
                    url: urlToCall 
                }, 
                    function(error, response, body){
                        body = JSON.parse(body)
                        if(error){
                            reject(error)
                        }else{
                            if(body.data!=null){
                                resolve(body.data[0])
                            }else{
                                resolve(null)
                            }
                        }
                });
            }).catch((err)=>{
                reject(err)
            })
        })
    },

    /**
    * IF OFFLINE RETURN NULL
    *    game_id 	     |string| 	ID of the game being played on the stream.
    *    id 	         |string| 	Stream ID.
    *    language 	     |string| 	Stream language.
    *    pagination 	 |string| 	A cursor value, to be used in a subsequent request to specify the starting point of the next set of results.
    *    started_at 	 |string| 	UTC timestamp. 
    *    tag_ids 	     |string| 	Shows tag IDs that apply to the stream.
    *    thumbnail_url   |string| 	Thumbnail URL of the stream. All image URLs have variable width and height. You can replace {width} and {height} with any values to get that size image
    *    title 	         |string| 	Stream title.
    *    type 	         |string| 	Stream type: "live" or "" (in case of error).
    *    user_id 	     |string| 	ID of the user who is streaming.
    *    user_name 	     |string| 	Display name corresponding to user_id.
    *    viewer_count    | int  |   Number of viewers watching the stream at the time of the query.
     * @param {*} streamerID 
     */
    getStream_2(streamerID){
        return new Promise((resolve,reject)=>{
            getTwitchAccessToken().then((bearer_token)=>{
                let urlToCall = API_ENDPOINT+'streams?user_id='+streamerID
                request.get({ 
                    headers: {
                        'content-type' : 'application/json',
                        'Authorization': 'Bearer '+bearer_token,
                        'Client-ID' : app_twitch_client_id
                    }, 
                    url: urlToCall 
                }, 
                    function(error, response, body){
                        body = JSON.parse(body)
                        if(error){
                            reject(error)
                        }else{
                            if(body.data!=null){
                                resolve(body.data[0])
                            }else{
                                resolve(null)
                            }
                        }
                });
            }).catch((err)=>{
                reject(err)
            })
        })
    },
    

     /**
     * return information about the stream and the user ( the streamer )
     * return object under this form : 
     * {
     *    broadcaster_type       |string| 	User’s broadcaster type: "partner", "affiliate", or "".
     *    -------------------------------------------------------------------------------------------------------------- Overwrites      description 	         |string| 	User’s channel description.
     *    display_name 	         |string| 	User’s display name.
     *    email 	             |string| 	User’s email address. Returned if the request includes the user:read:email scope.
     *    -------------------------------------------------------------------------------------------------------------- Overwrites      id 	                 |string| 	User’s ID.
     *    login 	             |string| 	User’s login name.
     *    offline_image_url      |string| 	URL of the user’s offline image.
     *    profile_image_url      |string| 	URL of the user’s profile image.
     *    -------------------------------------------------------------------------------------------------------------- Overwrites      type 	                 |string| 	User’s type: "staff", "admin", "global_mod", or "".
     *    view_count 	         | int  |   Total number of views of the user’s channel.
     *    broadcaster_id 	     |string| 	Twitch User ID of this channel owner
     *    broadcaster_name 	     |string| 	Twitch User name of this channel owner
     *    MAY NOT BE OVERWRITE IF STREAM IS OFFLINE -------------------------------------------------------------------- Overwrites      game_id 	             |string| 	Current game ID being played on the channel
     *    broadcaster_language   |string| 	Language of the channel
     *    title 	             |string| 	Title of the stream
     *    description 	         |string| 	Description of the stream
     *    isStreaming            |boolean|  if streaming = true else = false
     *    FROM THIS PART MAY NOT APPEAR IF STREAM OFFLINE
     *    game_id 	             |string| 	ID of the game being played on the stream.
     *    id 	                 |string| 	Stream ID.
     *    language 	             |string| 	Stream language.
     *    pagination 	         |string| 	A cursor value, to be used in a subsequent request to specify the starting point of the next set of results.
     *    started_at 	         |string| 	UTC timestamp. 
     *    tag_ids 	             |string| 	Shows tag IDs that apply to the stream.
     *    thumbnail_url          |string| 	Thumbnail URL of the stream. All image URLs have variable width and height. You can replace {width} and {height} with any values to get that size image
     *    title 	             |string| 	Stream title.
     *    type 	                 |string| 	Stream type: "live" or "" (in case of error).
     *    user_id 	             |string| 	ID of the user who is streaming.
     *    user_name 	         |string| 	Display name corresponding to user_id.
     *    viewer_count           | int  |   Number of viewers watching the stream at the time of the query.
     * }
     * @param {*} streamerID 
     */
    getStreamer(streamerID){
        return new Promise((resolve,reject)=>{

            let promises = new Array()
            
            promises.push(this.getUser(streamerID),this.getStream_1(streamerID),this.getStream_2(streamerID))


           /* StreamerInfo under this form : 
            * {
            *    broadcaster_type    |string| 	User’s broadcaster type: "partner", "affiliate", or "".
            *    description 	     |string| 	User’s channel description.
            *    display_name 	     |string| 	User’s display name.
            *    email 	             |string| 	User’s email address. Returned if the request includes the user:read:email scope.
            *    id 	             |string| 	User’s ID.
            *    login 	             |string| 	User’s login name.
            *    offline_image_url   |string| 	URL of the user’s offline image.
            *    profile_image_url   |string| 	URL of the user’s profile image.
            *     type 	             |string| 	User’s type: "staff", "admin", "global_mod", or "".
            *    view_count 	     | int  |    Total number of views of the user’s channel.
            * },
            * {
            *    broadcaster_id 	     |string| 	Twitch User ID of this channel owner
            *    broadcaster_name 	     |string| 	Twitch User name of this channel owner
            *    game_id 	             |string| 	Current game ID being played on the channel
            *    broadcaster_language    |string| 	Language of the channel
            *    title 	                 |string| 	Title of the stream
            *    description 	         |string| 	Description of the stream
            * },
            *{FROM THIS PART MAY NOT APPEAR IF STREAM OFFLINE
            *    game_id 	         |string| 	ID of the game being played on the stream.
            *    id 	             |string| 	Stream ID.
            *    language 	         |string| 	Stream language.
            *    pagination 	     |string| 	A cursor value, to be used in a subsequent request to specify the starting point of the next set of results.
            *    started_at 	     |string| 	UTC timestamp. 
            *    tag_ids 	         |string| 	Shows tag IDs that apply to the stream.
            *    thumbnail_url       |string| 	Thumbnail URL of the stream. All image URLs have variable width and height. You can replace {width} and {height} with any values to get that size image
            *    title 	             |string| 	Stream title.
            *    type 	             |string| 	Stream type: "live" or "" (in case of error).
            *    user_id 	         |string| 	ID of the user who is streaming.
            *    user_name 	         |string| 	Display name corresponding to user_id.
            *    viewer_count        | int  |   Number of viewers watching the stream at the time of the query.
            * }
            */

            Promise.all(promises).then((streamerInfo)=>{
                let correctStreamerInfoObjc
                    if(streamerInfo[2]==null){
                        correctStreamerInfoObjc = merge_options(streamerInfo[0],streamerInfo[1])
                        correctStreamerInfoObjc.isStreaming=false
                    }else{
                        correctStreamerInfoObjc = merge_options(streamerInfo[0],streamerInfo[1],streamerInfo[2])
                        correctStreamerInfoObjc.isStreaming=true
                    }
                    resolve(correctStreamerInfoObjc)
            }).catch((err)=>{
                reject(err)
            })
        })
    },

    getUserIDByName(userName){
        return new Promise((resolve,reject)=>{
            getTwitchAccessToken().then((bearer_token)=>{
                let urlToCall = API_ENDPOINT+'users?login='+userName
                request.get({ 
                    headers: {
                        'content-type' : 'application/json',
                        'Authorization': 'Bearer '+bearer_token,
                        'Client-ID' : app_twitch_client_id
                    }, 
                    url: urlToCall 
                }, 
                    function(error, response, body){
                        body = JSON.parse(body)
                        if(error){
                            reject(error)
                        }else{
                            if(body.data.length>=1){
                                resolve(body.data[0].id)
                            }else{
                                resolve(null)
                            }
                        }
                });
            }).catch((err)=>{
                reject(err)
            })
        })
    },
}

/**
 * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
 * @param obj1
 * @param obj2
 * @returns obj3 a new object based on obj1 and obj2
 */
function merge_options(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

/**
 * First Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1. Secondly Overwrites obj2's values with obj3's and adds obj3's if non existent in obj2.
 * @param obj1
 * @param obj2
 * @param obj3
 * @returns obj4 a new object based on obj1 and obj2
 */
function merge_options(obj1,obj2,obj3){
    var obj4 = {};
    for (var attrname in obj1) { obj4[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj4[attrname] = obj2[attrname]; }
    for (var attrname in obj3) { obj4[attrname] = obj3[attrname]; }
    return obj4;
}