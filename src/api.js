const express = require('express'); 
const fs = require('fs')
const https = require('https')
const database = require('./database')
const twitchAPI = require('./twitch-api');

const domain="uptextv.com"
const port = 3000; 

const privateKey = fs.readFileSync('/etc/letsencrypt/live/'+domain+'/privkey.pem', 'utf8'); // https://itnext.io/node-express-letsencrypt-generate-a-free-ssl-certificate-and-run-an-https-server-in-5-minutes-a730fbe528ca
const certificate = fs.readFileSync('/etc/letsencrypt/live/'+domain+'/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/'+domain+'/chain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};

var app = express();  
app.use((req, res, next) => {
    res.append('Access-Control-Allow-Origin' , 'https://www.twitch.tv');
    res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    next();
});

var server = https.createServer(credentials, app)
    .listen(port, function () {
})  

var io = require('socket.io').listen(server);

io.on('connection', (socket) => {

    socket.on('setup',(cryptedUserID)=>{
        setup(cryptedUserID).then(()=>{
            socket.emit('callback_setup','done')
        }).catch((err)=>{
            socket.emit('callback_setup',err)
        })
    })

    socket.on('group_exist',(cryptedGroupID,cryptedUserID)=>{
        group_exist(cryptedGroupID,cryptedUserID).then((isGroupExist)=>{
            socket.emit('callback_group_exist','done',isGroupExist)
        }).catch((err)=>{
            socket.emit('callback_group_exist',err)
        })
    })

    socket.on('add_group',(cryptedGroupID,cryptedUserID)=>{
        add_group(cryptedGroupID,cryptedUserID).then(()=>{
            socket.emit('callback_add_group','done')
        }).catch((err)=>{
            socket.emit('callback_add_group',err)
        })
    })

    socket.on('delete_group',(cryptedGroupID,cryptedUserID)=>{
        delete_group(cryptedGroupID,cryptedUserID).then(()=>{
            socket.emit('callback_delete_group','done')
        }).catch((err)=>{
            socket.emit('callback_delete_group',err)
        })     
    })

    socket.on('add_streamer_in_group',(cryptedGroupID,cryptedUserID,cryptedStreamerID)=>{
        add_streamer_in_group(cryptedGroupID,cryptedUserID,cryptedStreamerID).then(()=>{
            socket.emit('callback_add_streamer_in_group','done')
        }).catch((err)=>{
            socket.emit('callback_add_streamer_in_group',err)
        })
    })

    socket.on('delete_streamer_in_group',(cryptedGroupID,cryptedUserID,cryptedStreamerID)=>{
        delete_streamer_in_group(cryptedGroupID,cryptedUserID,cryptedStreamerID).then(()=>{
            socket.emit('callback_delete_streamer_in_group','done')
        }).catch((err)=>{
            socket.emit('callback_delete_streamer_in_group',err)
        })
    })

    socket.on('get_streamer_info',(cryptedStreamerID)=>{
        get_streamer_info(cryptedStreamerID).then((streamerInfo)=>{
            socket.emit('callback_get_streamer_info','done',streamerInfo)
        }).catch((err)=>{
            socket.emit('callback_get_streamer_info',err)
        })
    })

    socket.on('get_groups',(cryptedUserID)=>{
        get_groups(cryptedUserID).then((groups)=>{
            socket.emit('callback_get_groups','done',groups)
        }).catch((err)=>{
            socket.emit('callback_get_groups',err)
        })
    })

    /**
     * use to set liveColor, sortIndex, groupPosition, groupIsHidden
     */
    socket.on('set_group_property',(cryptedGroupID,cryptedUserID,propertyName,propertyValue)=>{
        set_group_property(cryptedGroupID,cryptedUserID,propertyName,propertyValue).then(()=>{
            socket.emit('callback_set_group_property',propertyName,'done')
        }).catch((err)=>{
            socket.emit('callback_set_group_property',propertyName,err)
        })
    })

    /**
     * use to get liveColor, sortIndex, groupPosition, groupIsHidden
     */
    socket.on('get_group_property',(cryptedGroupID,cryptedUserID,propertyName)=>{
        get_group_property(cryptedGroupID,cryptedUserID,propertyName).then((propertyValue)=>{
            socket.emit('callback_get_group_property',propertyName,'done',propertyValue)
        }).catch((err)=>{
            socket.emit('callback_get_group_property',propertyName,err)
        })
    })
});

/**
 * 
 * @param {String} userID in normal
 */
function setup(cryptedUserID){
    return new Promise((resolve,reject)=>{
        try{
            let userID = decryptID(cryptedUserID)        
            database.isUserExist(userID).then((userExist)=>{
                if(!userExist){
                    database.addNewUser(userID).then(()=>{
                        resolve()
                    }).catch((err)=>{
                        reject(err)
                    })
                }else{
                    resolve(true)
                }
            }).catch((err)=>{
                reject(err)
            })
        }catch(err){
            reject(err)
        }
    })
}

function group_exist(cryptedGroupID,cryptedUserID){
    return new Promise((resolve,reject)=>{
        try{
            let userID = decryptID(cryptedUserID)
            database.isGroupExist(cryptedGroupID,userID).then((groupExistBoolean)=>{
                resolve(groupExistBoolean)
            })            
        }catch{
            reject('stop trying to hack this api, you are going to be ban')
        }
    })
}

function add_group(cryptedGroupID,cryptedUserID){
    return new Promise((resolve,reject)=>{
        try{
            let userID = decryptID(cryptedUserID)
            database.addGroup(cryptedGroupID,userID).then(()=>{
                resolve()
            }).catch((err)=>{
                reject(err)
            })
        }catch{
            reject('stop trying to hack this api, you are going to be ban')
        }
    })
}

function delete_group(cryptedGroupID,cryptedUserID){
    return new Promise((resolve,reject)=>{
        try{
            let userID = decryptID(cryptedUserID)
            database.deleteGroup(cryptedGroupID,userID).then(()=>{
                resolve()
            }).catch((err)=>{
                reject(err)
            })
        }catch{
            reject('stop trying to hack this api, you are going to be ban')
        }
    })
}

function add_streamer_in_group(cryptedGroupID,cryptedUserID,cryptedStreamerID){
    return new Promise((resolve,reject)=>{
        decryptIDS(cryptedUserID,cryptedStreamerID).then((arrayOfIDS)=>{
            let userID = arrayOfIDS[0]
            let streamerID = arrayOfIDS[1]
            database.addStreamer(cryptedGroupID,userID,streamerID).then(()=>{
                resolve()
            }).catch((err)=>{
                reject(err)
            })
        }).catch(()=>{
            reject('stop trying to hack this api, you are going to be ban')
        })
    })
}

function delete_streamer_in_group(cryptedGroupID,cryptedUserID,cryptedStreamerID){
    return new Promise((resolve,reject)=>{
        decryptIDS(cryptedUserID,cryptedStreamerID).then((arrayOfIDS)=>{
            let userID = arrayOfIDS[0]
            let streamerID = arrayOfIDS[1]
            database.deleteStreamer(cryptedGroupID,userID,streamerID).then(()=>{
                resolve()
            }).catch((err)=>{
                reject(err)
            })
        }).catch(()=>{
            reject('stop trying to hack this api, you are going to be ban')
        })
    })
}

function get_streamer_info(cryptedStreamerID){
    return new Promise((resolve,reject)=>{
        try{
            let streamerID = decryptID(cryptedStreamerID)
            twitchAPI.getStreamer(streamerID).then((_streamerInfo)=>{
                resolve(_streamerInfo)
            }).catch((err)=>{
                reject(err)
            })
        }catch{
            reject('stop trying to hack this api, you are going to be ban')
        }
    })
}

function get_groups(cryptedUserID){
    return new Promise((resolve,reject)=>{
        try{
            let userID = decryptID(cryptedUserID)
            database.getStreamers(userID).then((streamers)=>{

                let getStreamersInfo = new Array() // push each promise get streamer info into an arrat
                streamers.forEach((streamer)=>{
                    getStreamersInfo.push(twitchAPI.getStreamer(streamer))
                })                        
                    

                Promise.all(getStreamersInfo).then((streamersInfo)=>{ // we've got streamersInfo 

                    database.getGroups(userID).then((groups)=>{
                                
                        let arrayToReturn = new Array()
                        let currentGroupList // for this group creating an array which contain all streamer info of this group   

                        groups.forEach((currentGroup)=>{
                            currentGroupList = new Array()
                            currentGroup['list'].forEach((streamerID)=>{
                                let desireStreamerInfo = streamersInfo.filter( streamerInfo => streamerInfo['broadcaster_id'] == streamerID ) // getting the desire streamer info of the list of all streamers info
                                currentGroupList.push(desireStreamerInfo[0]) // pushing the desire streamer info in the array of the current streamers group
                            })

                            currentGroup['name']=getGroupCryptedID(currentGroup['name'])
                            currentGroup['list']=currentGroupList
                        
                            arrayToReturn.push(currentGroup)
                        })

                        resolve(arrayToReturn)
                    })
                })
            }).catch((err)=>{
                reject(err)
            })
        }catch{
            reject('stop trying to hack this api, you are going to be ban')
        }
    })
}

function set_group_property(cryptedGroupID,cryptedUserID,propertyName,propertyValue){
    return new Promise((resolve,reject)=>{
        try{
            let userID = decryptID(cryptedUserID)
            database.setGroupProperty(cryptedGroupID,userID,propertyName,propertyValue).then(()=>{
                resolve()
            }).catch((err)=>{
                reject(err)
            })  
        }catch(err){
            reject(err)
        }
    })
}

function get_group_property(cryptedGroupID,cryptedUserID,propertyName){
    return new Promise((resolve,reject)=>{
        try{
            let userID = decryptID(cryptedUserID)
            database.getGroupProperty(cryptedGroupID,userID,propertyName).then((propertyValue)=>{
                resolve(propertyValue)
            }).catch((err)=>{
                reject(err)
            })
        }catch(err){
            reject(err)
        }
    })
}








function decryptIDS(){
    return new Promise((resolve,reject)=>{
        try{
            arrayNormalID = new Array()
            for(let x=0;x<arguments.length;x++){
                let cryptedID = arguments[x]
                arrayNormalID.push(decryptID(cryptedID))
            }
            resolve(arrayNormalID)
        }catch(_){
            reject(_)
        }
    })
}

/**
 * encrypt id
 * if reject it mean what someone is trying to understand your api 
 * 
 * crypted :
 * |____________________________________0xxxxxxxxxxxxxxxxxxxxxxxxx-___________|
 * ^                                    ^                         ^           ^
 * |                                    |                         |           |
 *  __                                  |                         |            _______
 *    |                                 |                         |                   |
 *  start (you don't care)        start crypted id               end crpyted id      end (you don't care)
 *                                '0' not include                  '-' not include
 *                                      [     id in x16 (hexa)   ]
 * 
 * @param {*} cryptedID 
 */
function decryptID(cryptedID){
    try{
        let idFirstPart = cryptedID.split('-')[0]
        let secondPartInArray = idFirstPart.split('0')
        let id=''
        for(let x=1;x<secondPartInArray.length;x++){
            id+='0'+secondPartInArray[x]
        }
        id=parseInt(id,16)
        return id
    }catch(err){
        throw 'stop trying to this api, you are going to be ban'
    }
}

// from ttt to 156_156_156 
function getGroupCryptedID(groupID){
    let final = ''
    for(let x=0;x<groupID.length;x++){
        final+=groupID.charCodeAt(x)+'_'
    }
    return final.substring(0,final.length-1 )
}

//mongo pe_db --eval "db.dropDatabase();"
//mongo pe_db --eval "db.dropDatabase();" &cd /usr/twitch_pin_extension/api/ && npm run api-listen &
