
    var eotechar = {}

    eotechar.init = function() {
        //eotechar.setCharacterDefaults(); No defaults
        eotechar.events();
    }
    
    eotechar.defaults = {
        globalVars : {},
        character : {
            attributes : [
                {
                    name : "characterID",
                    current : "UPDATES TO CURRENT ID",
                    max : "",
                    update : false
                }
            ], 
            ablities : [],
        },
        graphics : {},
        'import' : {
            steve : { // use file name in future
                attributes : [
                    {
                        name : 'soak',
                        current : 2,
                        update : true
                    },
                    {
                        name : 'wounds',
                        current : '', //current
                        max : '', //Threshold
                        update : true
                    },
                    {
                        name : 'strain',
                        current : '', //current
                        max : '', //Threshold
                        update : true
                    },
                    {
                        name : 'rangeddefense',
                        current : '',
                        update : true
                    },
                    {
                        name : 'meleedefense',
                        current : '',
                        update : true
                    },
                    {
                        name : 'encumbrance',
                        current : '', //current
                        max : '', //Threshold
                        update : true
                    },
                    {
                        name : 'meleedefense',
                        current : '',
                        update : true
                    },
                ], 
            }
        },
        regex : {
            cmd : /!eechar \((.*?)\)/
        }
    }
    
    eotechar.createGMDicePool = function() {
        
        //create character -DicePool
        if (findObjs({ _type: "character", name: "-DicePool" }).length == 0){
           
            createObj("character", {
                name: "-DicePool",
                bio: "GM Dice Pool"
            });
           
            Char_dicePoolObject = findObjs({ _type: "character", name: "-DicePool" });
            
            createObj("attribute", {
                name: "pcgm",
                current: 3,
                characterid: Char_dicePoolObject[0].id
            });
        };
        
    }
    
    eotechar.createObj = function() {//Create Object Fix - Firebase.set failed
        var obj = createObj.apply(this, arguments);
        var id = obj.id;
        var characterID = obj.get('characterid');
        var type = obj.get('type');
        if (obj && !obj.fbpath && obj.changed) {
            obj.fbpath = obj.changed._fbpath.replace(/([^\/]*\/){4}/, "/");
        } else if (obj && !obj.changed && type == 'attribute') { //fix for dynamic attribute after in character created in game
            obj.fbpath = '/char-attribs/char/'+ characterID +'/'+ id;
            // /char-attribs/char/characterID/attributeID
        }
            
        return obj;
    }
    
    eotechar.setCharacterDefaults = function(characterObj) {
        
        var charObj = [characterObj];
        
        if (!characterObj) {
            charObj = findObjs({ _type: "character"});
        }
        
        //add/update characterID field
        _.each(charObj, function(charObj){
            
            //updates default attr:CharacterID to current character id
            _.findWhere(eotechar.defaults.character.attributes, {'name':'characterID'}).current = charObj.id;
            
            //Attributes
            eotechar.updateAddAttribute(charObj, eotechar.defaults.character.attributes);//Update Add Attribute defaults
            
            //Abilities

        });
    }
    
    eotechar.updateAddAttribute = function(charactersObj, updateAddAttributesObj ) { // charactersObj = object or array objects, updateAddAttributesObj = object or array objects
    
        //check if object or array
        if (!_.isArray(charactersObj)) {
            charactersObj = [charactersObj];
        }
        
        if (!_.isArray(updateAddAttributesObj)) {
            updateAddAttributesObj = [updateAddAttributesObj]; 
        }
       
        _.each(charactersObj, function(characterObj){//loop characters
            
            var characterName = '';
            
            if(characterObj.name) {
                characterName = characterObj.name;
            } else {
                characterName = characterObj.get('name');
            }
            
            //find attribute via character ID
            var characterAttributesObj = findObjs({ _type: "attribute", characterid: characterObj.id});
            
            log('//------------------------------->'+ characterName);
            
           _.each(updateAddAttributesObj, function(updateAddAttrObj){ //loop attributes to update / add
                
                attr = _.find(characterAttributesObj, function(a) {
                    return (a.get('name') === updateAddAttrObj.name);
                });

                if (attr) {
            	   if (updateAddAttrObj.update) {
                        log('Update Attr: '+ updateAddAttrObj.name);
                        attr.set({current: updateAddAttrObj.current});
                        attr.set({max: updateAddAttrObj.max});
        			}
        		} else {
        		    log('Add Attr: '+ updateAddAttrObj.name);
                    eotechar.createObj('attribute', {
            			characterid: characterObj.id,
            			name: updateAddAttrObj.name,
            			current: updateAddAttrObj.current,
            			max: updateAddAttrObj.max
        			});
        		}
            });
        }); 
        
    }
    
    /* CHARACTER IMPORT PROCESS 
     * 
     * Matches the different regex commands and runs that dice processing step
     * The order of step should not be change or dice could be incorrectly rolled.
     * example: All dice needs to be 'upgraded" before it can be 'downgraded'
     * ---------------------------------------------------------------- */
    
    eotechar.process.setup = function() {
        
        //load char json array
        

        //create new character
        //check for character name if exsits add _copy, check if _copy add _copy_copy
        
        
        //add attributes
        //attr array and char array from char create
        
    }

    //convert to json, maybe if we do xml


    eotechar.events = function() {
        
        //event listner Add character defaults to new characters
        on("add:character", function(characterObj) {
            eotechar.setCharacterDefaults(characterObj);
        });
        
        on("chat:message", function(msg) {
            
            if (msg.type != 'api') {
                return;
            }
            
            eotechar.process.setup(msg.content, msg.who, msg.playerid);
        });
        
    }
    
    on('ready', function() {
        eotechar.init();
        eotechar.process.setup('!eedchar steve', 'Steve', 'playerID');
    });