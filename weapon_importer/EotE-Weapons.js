/* Import Weapon

 Chat command: !eeweapon weapon(Name) character(Name)
 Chat example: !eeweapon weapon(Holdout Blaster) character(Han Solo)
 
 Note: If weapon doesn't auto populate close character sheet and reopen

 * ------------------------------------------------------------------- */

var eoteweapon = {}

    eoteweapon.init = function() {
        //eoteweapon.setCharacterDefaults(); No defaults
        eoteweapon.events();
    }
    
    eoteweapon.defaults = {  
        globalVars : {},
        graphics : {},
        regex : {
            cmd : /!eeweapon/,
            weapon : /weapon\((.*?)\)/,
            character : /character\((.*?)\)/,
        }
    }
    
    eoteweapon.createObj = function() {//Create Object Fix - Firebase.set failed - Do not edit
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
    
    
    
    /* WEAPONS IMPORT PROCESS 
     * 
     * Matches the different regex commands and runs that dice processing step
     * The order of step should not be change or dice could be incorrectly rolled.
     * 
     * ---------------------------------------------------------------- */
    
    eoteweapon.defaults.weapon = function () {
        this.vars = {
				characterName : '',
                characterID : '',
                playerName : '',
                playerID : '',
				label : '',
                weapon : '',
			}
	}
    
    eoteweapon.process = {}
    
    eoteweapon.process.setup = function(cmd, playerName, playerID) {
        
        //log(cmd);
        
        if (!cmd.match(eoteweapon.defaults.regex.cmd)) { //check for api cmd !eed
            return false;
    	}
        
        
        /* reset dice - test, might not need this
         * ------------------------------------------------------------- */
        
		var weaponObj = new eoteweapon.defaults.weapon();
            weaponObj.vars.playerName = playerName;
            weaponObj.vars.playerID = playerID;
        
        //Match Character
        var characterMatch = cmd.match(eoteweapon.defaults.regex.character);
        
        if (characterMatch) {
            var charFound = eoteweapon.process.findCharacter(characterMatch, weaponObj);
            
            if (!charFound) {
                return false;
            }
        }
        
        
        //Match Weapon
        var weaponMatch = cmd.match(eoteweapon.defaults.regex.weapon);
        
        if (weaponMatch) {
            eoteweapon.process.addWeapon(weaponMatch, weaponObj);
        }
    
        
    }

    /* WEAPON PROCESS FUNCTION
     * 
     * ---------------------------------------------------------------- */

    eoteweapon.process.findCharacter = function (cmd, weaponObj) {
        
        var characterMatch = cmd[1];
        
        if (characterMatch && characterMatch != undefined) {
            
            var charObj = findObjs({ _type: "character", name: characterMatch });
            
            if (charObj.length > 0){
            
                weaponObj.vars.characterName = charObj[0].get('name');
                weaponObj.vars.characterID = charObj[0].id;
                return true;
                
            } else {
                sendChat("Alert", "Can't find character. Please update character name field to match sheet character name and try again.");
                return false;
            }
        } else {
            sendChat("Alert", "Please update character name field.");
            return false;
        }
        
    }

    eoteweapon.process.addWeapon = function (cmd, weaponObj) {
        
        var characterObj = [{name: weaponObj.vars.characterName, id: weaponObj.vars.characterID}];
        var weaponMatch = cmd[1];
        
        if (weaponMatch && eoteweapon.defaults['import'][weaponMatch]) {

            var weaponAttrs = eoteweapon.defaults['import'][weaponMatch].attributes;
            var allCharAttrs = findObjs({ _type: "attribute", characterid: characterObj[0].id});
            var openSlot = 0;
            var usedSlots = 0;
            var attrIndexStr = 'repeating_weapons_';

            //Find for open weapon attribute slot
            for (i = 0; i <= 20; i++) {    
                
                slot = _.find(allCharAttrs, function(a) {
                    return (a.get('name') === 'repeating_weapons_'+i+'_damage');
                });
                
                if (slot == undefined) {
                    openSlot = i;
                    break;
                } else {
                    usedSlots = usedSlots + 1;
                }
            }
            
            //loop attributes to create
            _.each(weaponAttrs, function(attr){
                //Create attribute
                
                //log(attr);
                
                eoteweapon.createObj('attribute', {
                    characterid: characterObj[0].id,
                    name: attrIndexStr+openSlot+'_'+attr.name,
                    current: attr.current,
                    max: attr.max ? attr.max : ''
                });
                
            });
            
             sendChat("Weapon", weaponMatch);
            
            return true;
            
        } else {
            sendChat("Alert", "Can't find weapon. Please update weapon name and try again.");
            return false;
        }
        
    }
    
    eoteweapon.events = function() {
        
        on("chat:message", function(msg) {
            
            if (msg.type != 'api') {
                return;
            }
            
            eoteweapon.process.setup(msg.content, msg.who, msg.playerid);
        });
        
    }
    
    on('ready', function() {
        eoteweapon.init();
        //eoteweapon.process.setup('!eeweapon weapon(Holdout Blaster) character(Steve)', 'Steve', 'playerID');
    });
    
    
    eoteweapon.defaults['import'] = {
        'Holdout Pistol' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Holdout Pistol'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 5
                },
                {
                    name : 'critical',
                    current : 4
                },
                {
                    name : 'weaponrange',
                    current : 'Short' //Engaged Short Medium Long
                },
                {
                    name : 'encum',
                    current : 1
                },
                {
                    name : 'hp',
                    current : 1
                },
                {
                    name : 'weaponspecial',
                    current : 'Stun Setting'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Light Blaster Pistol' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Light Blaster Pistol'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 5
                },
                {
                    name : 'critical',
                    current : 4
                },
                {
                    name : 'weaponrange',
                    current : 'Medium' //Engaged Short Medium Long
                },
                {
                    name : 'encum',
                    current : 1
                },
                {
                    name : 'hp',
                    current : 2
                },
                {
                    name : 'weaponspecial',
                    current : 'Stun Setting'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Blaster Pistol' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Blaster Pistol'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 6
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Medium' //Engaged Short Medium Long
                },
                {
                    name : 'encum',
                    current : 1
                },
                {
                    name : 'hp',
                    current : 3
                },
                {
                    name : 'weaponspecial',
                    current : 'Stun Setting'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Heavy Blaster Pistol' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Heavy Blaster Pistol'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 7
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Medium' //Engaged Short Medium Long
                },
                {
                    name : 'encum',
                    current : 2
                },
                {
                    name : 'hp',
                    current : 3
                },
                {
                    name : 'weaponspecial',
                    current : 'Stun Setting'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Blaster Carbine' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Blaster Carbine'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankHeavy}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 9
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Medium' //Engaged Short Medium Long
                },
                {
                    name : 'encum',
                    current : 3
                },
                {
                    name : 'hp',
                    current : 4
                },
                {
                    name : 'weaponspecial',
                    current : 'Stun Setting'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Blaster Rifle' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Blaster Rifle'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankHeavy}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 9
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Long' //Engaged Short Medium Long
                },
                {
                    name : 'encum',
                    current : 4
                },
                {
                    name : 'hp',
                    current : 4
                },
                {
                    name : 'weaponspecial',
                    current : 'Stun Setting'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Heavy Blaster Rifle' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Heavy Blaster Rifle'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankHeavy}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 10
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Long' //Engaged Short Medium Long
                },
                {
                    name : 'encum',
                    current : 6
                },
                {
                    name : 'hp',
                    current : 4
                },
                {
                    name : 'weaponspecial',
                    current : 'Auto-Fire, Cumbersome 3'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Light Repeating Blaster' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Light Repeating Blaster'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankHeavy}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 11
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Long' //Engaged Short Medium Long
                },
                {
                    name : 'encum',
                    current : 7
                },
                {
                    name : 'hp',
                    current : 4
                },
                {
                    name : 'weaponspecial',
                    current : 'Auto-Fire, Cumbersome 4, Pierce 1'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Heavy Repeating Blaster' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Heavy Repeating Blaster'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankGunnery}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 15
                },
                {
                    name : 'critical',
                    current : 2
                },
                {
                    name : 'weaponrange',
                    current : 'Long' //Engaged Short Medium Long
                },
                {
                    name : 'encum',
                    current : 9
                },
                {
                    name : 'hp',
                    current : 4
                },
                {
                    name : 'weaponspecial',
                    current : 'Auto-Fire, Cumbersome 5, Pierce 2, Vicious 1'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Bowcaster' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Bowcaster'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankHeavy}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 10
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Medium' //Engaged Short Medium Long
                },
                {
                    name : 'encum',
                    current : 5
                },
                {
                    name : 'hp',
                    current : 2
                },
                {
                    name : 'weaponspecial',
                    current : 'Cumbersome 3, knockdown'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Ionization Blaster' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Ionization Blaster'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 10
                },
                {
                    name : 'critical',
                    current : 5
                },
                {
                    name : 'weaponrange',
                    current : 'Short' //Engaged Short Medium Long
                },
                {
                    name : 'encum',
                    current : 3
                },
                {
                    name : 'hp',
                    current : 3
                },
                {
                    name : 'weaponspecial',
                    current : 'Disorient 5, Stun Damage (Droid only)'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Disruptor Pistol' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Disruptor Pistol'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 10
                },
                {
                    name : 'critical',
                    current : 2
                },
                {
                    name : 'weaponrange',
                    current : 'Short' //Engaged Short Medium Long
                },
                {
                    name : 'encum',
                    current : 2
                },
                {
                    name : 'hp',
                    current : 2
                },
                {
                    name : 'weaponspecial',
                    current : 'Vicious 4'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Disruptor Rifle' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Disruptor Rifle'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankHeavy}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 10
                },
                {
                    name : 'critical',
                    current : 2
                },
                {
                    name : 'weaponrange',
                    current : 'Long' //Engaged Short Medium Long
                },
                {
                    name : 'encum',
                    current : 5
                },
                {
                    name : 'hp',
                    current : 4
                },
                {
                    name : 'weaponspecial',
                    current : 'Cumbersome 2, Vicious 5'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Slugthrower Pistol' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Slugthrower Pistol'
                }, 
                {
                    name : 'weapontype',
                    current : 'Slugthrower'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 4
                },
                {
                    name : 'critical',
                    current : 5
                },
                {
                    name : 'weaponrange',
                    current : 'Short' //Engaged Short Medium Long
                },
                {
                    name : 'encum',
                    current : 1
                },
                {
                    name : 'hp',
                    current : 0
                },
                {
                    name : 'weaponspecial',
                    current : ''
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Slugthrower Rifle' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Slugthrower Rifle'
                }, 
                {
                    name : 'weapontype',
                    current : 'Slugthrower'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankHeavy}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 7
                },
                {
                    name : 'critical',
                    current : 5
                },
                {
                    name : 'weaponrange',
                    current : 'Mediumn' //Engaged Short Medium Long
                },
                {
                    name : 'encum',
                    current : 5
                },
                {
                    name : 'hp',
                    current : 1
                },
                {
                    name : 'weaponspecial',
                    current : 'Cumbersome 2'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Bola Net' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Bola Net'
                }, 
                {
                    name : 'weapontype',
                    current : 'Thrown Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 2
                },
                {
                    name : 'critical',
                    current : ''
                },
                {
                    name : 'weaponrange',
                    current : 'Short' //Engaged Short Medium Long
                },
                {
                    name : 'encum',
                    current : '1/3'
                },
                {
                    name : 'hp',
                    current : 2
                },
                {
                    name : 'weaponspecial',
                    current : 'Ensnare 3, Knockdown, Limited Ammo 1'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Flame Projector' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Flame Projector'
                }, 
                {
                    name : 'weapontype',
                    current : 'Explosive'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankHeavy}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 8
                },
                {
                    name : 'critical',
                    current : 2
                },
                {
                    name : 'weaponrange',
                    current : 'Short' //Engaged Short Medium Long
                },
                {
                    name : 'encum',
                    current : 6
                },
                {
                    name : 'hp',
                    current : 2
                },
                {
                    name : 'weaponspecial',
                    current : 'Burn 3, Blast 8'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Missile Tube' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Missile Tube'
                }, 
                {
                    name : 'weapontype',
                    current : 'Explosive'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankGunnery}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 20
                },
                {
                    name : 'critical',
                    current : 2
                },
                {
                    name : 'weaponrange',
                    current : 'Extreme' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 7
                },
                {
                    name : 'hp',
                    current : 4
                },
                {
                    name : 'weaponspecial',
                    current : 'Blast 10, Cumbersome 3, Guided 3, Breach 1, Prepare 1, Limited Ammo 6'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Frag Grendae' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Frag Grendae'
                }, 
                {
                    name : 'weapontype',
                    current : 'Explosive'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 8
                },
                {
                    name : 'critical',
                    current : 4
                },
                {
                    name : 'weaponrange',
                    current : 'Short' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 1
                },
                {
                    name : 'hp',
                    current : 0
                },
                {
                    name : 'weaponspecial',
                    current : 'Blast 6, Limited Ammo 1'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Armor-Piercing Grenade' : { //AoR
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Aromor-Piercing Grenade'
                }, 
                {
                    name : 'weapontype',
                    current : 'Explosive'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 13
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Short' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 1
                },
                {
                    name : 'hp',
                    current : 0
                },
                {
                    name : 'weaponspecial',
                    current : 'Blast 4, Limited Ammo 1, Pierce 3'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Stun Grendae' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Stun Grendae'
                }, 
                {
                    name : 'weapontype',
                    current : 'Explosive'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 8
                },
                {
                    name : 'critical',
                    current : ''
                },
                {
                    name : 'weaponrange',
                    current : 'Short' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 1
                },
                {
                    name : 'hp',
                    current : 0
                },
                {
                    name : 'weaponspecial',
                    current : 'Disorient 3, Stun Damage, Blast 8, Limited Ammo 1'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Anti-Vehicle Mine' : { //AoR
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Anti-Vehicle Mine'
                }, 
                {
                    name : 'weapontype',
                    current : 'Explosive'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankMechanics}|@{intellect})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 12
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Engaged' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 3
                },
                {
                    name : 'hp',
                    current : 0
                },
                {
                    name : 'weaponspecial',
                    current : 'Blast 4, Vicious 4, Limited Ammo 1' 
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Anti-Personal Mine' : { //AoR
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Anti-Personal Mine'
                }, 
                {
                    name : 'weapontype',
                    current : 'Explosive'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankMechanics}|@{intellect})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 25
                },
                {
                    name : 'critical',
                    current : 2
                },
                {
                    name : 'weaponrange',
                    current : 'Engaged' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 4
                },
                {
                    name : 'hp',
                    current : 0
                },
                {
                    name : 'weaponspecial',
                    current : 'Blast 2, Breach 4, Limited Ammo 1' 
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Thermo Detonator' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Thermo Detonator'
                }, 
                {
                    name : 'weapontype',
                    current : 'Explosive'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 20
                },
                {
                    name : 'critical',
                    current : 2
                },
                {
                    name : 'weaponrange',
                    current : 'Short' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 1
                },
                {
                    name : 'hp',
                    current : 0
                },
                {
                    name : 'weaponspecial',
                    current : 'Blast 15, Breach 1, Vicious 4, Limited Ammo 1'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Brass Knuckles' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Brass Knuckles'
                }, 
                {
                    name : 'weapontype',
                    current : 'Brawling Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankBrawl}|@{brawn})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : '+1'
                },
                {
                    name : 'critical',
                    current : 4
                },
                {
                    name : 'weaponrange',
                    current : 'Engaged' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 1
                },
                {
                    name : 'hp',
                    current : 0
                },
                {
                    name : 'weaponspecial',
                    current : 'Disorient 3'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Shock Gloves' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Shock Gloves'
                }, 
                {
                    name : 'weapontype',
                    current : 'Brawling Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankBrawl}|@{brawn})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : '+0'
                },
                {
                    name : 'critical',
                    current : 5
                },
                {
                    name : 'weaponrange',
                    current : 'Engaged' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 0
                },
                {
                    name : 'hp',
                    current : 1
                },
                {
                    name : 'weaponspecial',
                    current : 'Stun 3'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Combat Knife' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Combat Knife'
                }, 
                {
                    name : 'weapontype',
                    current : 'Melee Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankMelee}|@{brawn})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : '+1'
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Engaged' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 1
                },
                {
                    name : 'hp',
                    current : 0
                },
                {
                    name : 'weaponspecial',
                    current : ''
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Gaffi Stick' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Gaffi Stick'
                }, 
                {
                    name : 'weapontype',
                    current : 'Melee Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankMelee}|@{brawn})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : '+2'
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Engaged' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 3
                },
                {
                    name : 'hp',
                    current : 0
                },
                {
                    name : 'weaponspecial',
                    current : 'Defensive 1, Disorient 3'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Force Pike' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Force Pike'
                }, 
                {
                    name : 'weapontype',
                    current : 'Melee Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankMelee}|@{brawn})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : '+3'
                },
                {
                    name : 'critical',
                    current : 2
                },
                {
                    name : 'weaponrange',
                    current : 'Engaged' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 3
                },
                {
                    name : 'hp',
                    current : 3
                },
                {
                    name : 'weaponspecial',
                    current : 'Pierce 2, Stun Setting'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Truncheon' : { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Truncheon'
                }, 
                {
                    name : 'weapontype',
                    current : 'Melee Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankMelee}|@{brawn})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : '+2'
                },
                {
                    name : 'critical',
                    current : 5
                },
                {
                    name : 'weaponrange',
                    current : 'Engaged' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 2
                },
                {
                    name : 'hp',
                    current : 0
                },
                {
                    name : 'weaponspecial',
                    current : 'Disorient 2'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Vibro-Ax': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Vibro-Ax'
                }, 
                {
                    name : 'weapontype',
                    current : 'Melee Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankMelee}|@{brawn})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : '+3'
                },
                {
                    name : 'critical',
                    current : 2
                },
                {
                    name : 'weaponrange',
                    current : 'Engaged' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 4
                },
                {
                    name : 'hp',
                    current : 3
                },
                {
                    name : 'weaponspecial',
                    current : 'Pierce 2, Sunder, Vicious 3'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Vibroknife': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Vibroknife'
                }, 
                {
                    name : 'weapontype',
                    current : 'Melee Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankMelee}|@{brawn})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : '+1'
                },
                {
                    name : 'critical',
                    current : 2
                },
                {
                    name : 'weaponrange',
                    current : 'Engaged' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 1
                },
                {
                    name : 'hp',
                    current : 2
                },
                {
                    name : 'weaponspecial',
                    current : 'Pierce 2, Vicious 1'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Vibrosword': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Vibrosword'
                }, 
                {
                    name : 'weapontype',
                    current : 'Melee Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankMelee}|@{brawn})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : '+2'
                },
                {
                    name : 'critical',
                    current : 2
                },
                {
                    name : 'weaponrange',
                    current : 'Engaged' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 3
                },
                {
                    name : 'hp',
                    current : 3
                },
                {
                    name : 'weaponspecial',
                    current : 'Pierce 2, Vicious 1, Defensive 1'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        //Far Horizons
        '12 Defender': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : '12 Defender'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 5
                },
                {
                    name : 'critical',
                    current : 5
                },
                {
                    name : 'weaponrange',
                    current : 'Short' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 1
                },
                {
                    name : 'hp',
                    current : 0
                },
                {
                    name : 'weaponspecial',
                    current : 'Inferior, Limited Ammo 2'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Quickfire': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Quickfire'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 5
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Short' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 1
                },
                {
                    name : 'hp',
                    current : 0
                },
                {
                    name : 'weaponspecial',
                    current : 'Stun Setting'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Sonic Rifle': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Sonic Rifle'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankHeavy}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 8
                },
                {
                    name : 'critical',
                    current : 6
                },
                {
                    name : 'weaponrange',
                    current : 'Long' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 4
                },
                {
                    name : 'hp',
                    current : 3
                },
                {
                    name : 'weaponspecial',
                    current : 'Concussive 1, Slow-Firing 1, Stun Damage'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Spray Stick': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Spray Stick'
                }, 
                {
                    name : 'weapontype',
                    current : 'Other Ranged Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankHeavy}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 0
                },
                {
                    name : 'critical',
                    current : ''
                },
                {
                    name : 'weaponrange',
                    current : 'Long' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 4
                },
                {
                    name : 'hp',
                    current : 0
                },
                {
                    name : 'weaponspecial',
                    current : 'Accurate 2, Ensnare 4, Slow-Firing 1, Stun 8'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Suppressor': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Suppressor'
                }, 
                {
                    name : 'weapontype',
                    current : 'Other Ranged Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankHeavy}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 8
                },
                {
                    name : 'critical',
                    current : ''
                },
                {
                    name : 'weaponrange',
                    current : 'Medium' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 4
                },
                {
                    name : 'hp',
                    current : 2
                },
                {
                    name : 'weaponspecial',
                    current : 'Blast 5, Disorient 3, Stun Damage'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Tangle gun': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Tangle gun'
                }, 
                {
                    name : 'weapontype',
                    current : 'Other Ranged Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankHeavy}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 1
                },
                {
                    name : 'critical',
                    current : 4
                },
                {
                    name : 'weaponrange',
                    current : 'Short' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 2
                },
                {
                    name : 'hp',
                    current : 1
                },
                {
                    name : 'weaponspecial',
                    current : 'Ensnare 3'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Backhand Shock Gloves': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Backhand Shock Gloves'
                }, 
                {
                    name : 'weapontype',
                    current : 'Brawl Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankBrawl}|@{brawn})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : '+1'
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Engaged' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 0
                },
                {
                    name : 'hp',
                    current : 2
                },
                {
                    name : 'weaponspecial',
                    current : 'Concussive 1, Stun Damage, Slow-Firing 1'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Molecular Stiletto': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Molecular Stiletto'
                }, 
                {
                    name : 'weapontype',
                    current : 'Melee Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankMelee}|@{brawn})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : '+0'
                },
                {
                    name : 'critical',
                    current : 2
                },
                {
                    name : 'weaponrange',
                    current : 'Engaged' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 0
                },
                {
                    name : 'hp',
                    current : 2
                },
                {
                    name : 'weaponspecial',
                    current : 'Pierce 5, Vicious 1'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Riot Shield': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Riot Shield'
                }, 
                {
                    name : 'weapontype',
                    current : 'Melee Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankMelee}|@{brawn})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : '+0'
                },
                {
                    name : 'critical',
                    current : 6
                },
                {
                    name : 'weaponrange',
                    current : 'Engaged' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 5
                },
                {
                    name : 'hp',
                    current : 2
                },
                {
                    name : 'weaponspecial',
                    current : 'Cumbersome 3, Defensive 2, Deflection 2, Disorient 1'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Stun Baton': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Stun Baton'
                }, 
                {
                    name : 'weapontype',
                    current : 'Melee Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankMelee}|@{brawn})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : '+2'
                },
                {
                    name : 'critical',
                    current : 6
                },
                {
                    name : 'weaponrange',
                    current : 'Engaged' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 2
                },
                {
                    name : 'hp',
                    current : 2
                },
                {
                    name : 'weaponspecial',
                    current : 'Disorient 2, Stun Damage'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Thunderbolt': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Thunderbolt'
                }, 
                {
                    name : 'weapontype',
                    current : 'Melee Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankMelee}|@{brawn})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 5
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Engaged' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 2
                },
                {
                    name : 'hp',
                    current : 2
                },
                {
                    name : 'weaponspecial',
                    current : 'Concussive 1, Stun Damage'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        //Dangerous Covenants
        'Model 44 Blaster Pistol': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Model 44 Blaster Pistol'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 6
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Medium' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 1
                },
                {
                    name : 'hp',
                    current : 4
                },
                {
                    name : 'weaponspecial',
                    current : 'Stun Setting'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Model 80 Blaster Pistol': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Model 80 Blaster Pistol'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 6
                },
                {
                    name : 'critical',
                    current : 2
                },
                {
                    name : 'weaponrange',
                    current : 'Medium' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 2
                },
                {
                    name : 'hp',
                    current : 3
                },
                {
                    name : 'weaponspecial',
                    current : 'Stun Setting'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'IR-5 Blaster Pistol': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'IR-5 Blaster Pistol'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 5
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Medium' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 2
                },
                {
                    name : 'hp',
                    current : 2
                },
                {
                    name : 'weaponspecial',
                    current : 'Auto-fire, Inaccurate 1'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'DL-74 Heavy Blaster Pistol': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'DL-74 Heavy Blaster Pistol'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 8
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Medium' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 2
                },
                {
                    name : 'hp',
                    current : 2
                },
                {
                    name : 'weaponspecial',
                    current : ''
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'ACP Array Gun': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'ACP Array Gun'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankHeavy}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 6
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Short' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 3
                },
                {
                    name : 'hp',
                    current : 3
                },
                {
                    name : 'weaponspecial',
                    current : 'Blast 5, Stun Setting'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'DH-X Heavy Blaster Rifle': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'DH-X Heavy Blaster Rifle'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankHeavy}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 10
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Long' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 7
                },
                {
                    name : 'hp',
                    current : 4
                },
                {
                    name : 'weaponspecial',
                    current : 'Cumbersome 3, Pierce 2'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'OK-98 Blaster Carbine': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'OK-98 Blaster Carbine'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankHeavy}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 9
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Medium' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 4
                },
                {
                    name : 'hp',
                    current : 3
                },
                {
                    name : 'weaponspecial',
                    current : 'Stun Setting'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'SE-14r Light Repeating Blaster': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'SE-14r Light Repeating Blaster'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 6
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Medium' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 2
                },
                {
                    name : 'hp',
                    current : 3
                },
                {
                    name : 'weaponspecial',
                    current : 'Auto Fire, Stun Setting'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'VX Sidewinder Repeating Blaster': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'VX Sidewinder Repeating Blaster'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankGunnery}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 12
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Long' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 8
                },
                {
                    name : 'hp',
                    current : 4
                },
                {
                    name : 'weaponspecial',
                    current : 'Auto Fire, Cumbersome 5, Pierce 1, Vicious 1'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'HOB Heavy Repeating Blaster': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'HOB Heavy Repeating Blaster'
                }, 
                {
                    name : 'weapontype',
                    current : 'Energy Weapon'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankGunnery}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 15
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Extreme' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 8
                },
                {
                    name : 'hp',
                    current : 4
                },
                {
                    name : 'weaponspecial',
                    current : 'Auto Fire, Cumbersome 6, Pierce 2, Vicious 1'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Assault Carbine': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Assault Carbine'
                }, 
                {
                    name : 'weapontype',
                    current : 'Slugthrower'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankHeavy}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 6
                },
                {
                    name : 'critical',
                    current : 5
                },
                {
                    name : 'weaponrange',
                    current : 'Short' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 4
                },
                {
                    name : 'hp',
                    current : 1
                },
                {
                    name : 'weaponspecial',
                    current : 'Auto Fire, Inaccurate 1'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Fiver Pistol': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Fiver Pistol'
                }, 
                {
                    name : 'weapontype',
                    current : 'Slugthrower'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankLight}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 5
                },
                {
                    name : 'critical',
                    current : 4
                },
                {
                    name : 'weaponrange',
                    current : 'Short' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 2
                },
                {
                    name : 'hp',
                    current : 1
                },
                {
                    name : 'weaponspecial',
                    current : 'Accurate 1, Limited Ammo 5'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Flamestrike': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Flamestrike'
                }, 
                {
                    name : 'weapontype',
                    current : 'Explosive'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankGunnery}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 9
                },
                {
                    name : 'critical',
                    current : 2
                },
                {
                    name : 'weaponrange',
                    current : 'Short' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 8
                },
                {
                    name : 'hp',
                    current : 3
                },
                {
                    name : 'weaponspecial',
                    current : 'Burn 4, Blast 9, Cumbersome 3, Vicious 2'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Flechette Launcher Anti-Infantry': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Flechette Launcher (Anti-Infantry)'
                }, 
                {
                    name : 'weapontype',
                    current : 'Explosive'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankGunnery}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 8
                },
                {
                    name : 'critical',
                    current : 3
                },
                {
                    name : 'weaponrange',
                    current : 'Medium' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 6
                },
                {
                    name : 'hp',
                    current : 4
                },
                {
                    name : 'weaponspecial',
                    current : 'Blast 8, Cumbersome 3, Limited Ammo 4, Pierce 6, Prepare 1, Vicious 1'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Flechette Launcher Anti-Vehicle': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Flechette Launcher (Anti-Vehicle)'
                }, 
                {
                    name : 'weapontype',
                    current : 'Explosive'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankGunnery}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 10
                },
                {
                    name : 'critical',
                    current : 2
                },
                {
                    name : 'weaponrange',
                    current : 'Medium' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 6
                },
                {
                    name : 'hp',
                    current : 4
                },
                {
                    name : 'weaponspecial',
                    current : 'Breach 2, Cumbersome 3, Limited Ammo 4, Prepare 1, Vicious 3'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        'Grendae Launcher': { 
            attributes : [
                {
                    name : 'weaponmake',
                    current : 'Grendae Launcher'
                }, 
                {
                    name : 'weapontype',
                    current : 'Explosive'
                },
                {
                    name : 'weaponskill',
                    current : 'skill(@{rankGunnery}|@{agility})'
                    /*
                        skill(@{rankBrawl}|@{brawn})
                        skill(@{rankGunnery}|@{agility})
                        skill(@{rankMelee}|@{brawn})
                        skill(@{rankLight}|@{agility})
                        skill(@{rankHeavy}|@{agility})
                    */
                },
                {
                    name : 'damage',
                    current : 8
                },
                {
                    name : 'critical',
                    current : 4
                },
                {
                    name : 'weaponrange',
                    current : 'Medium' //Engaged Short Medium Long Extreme
                },
                {
                    name : 'encum',
                    current : 5
                },
                {
                    name : 'hp',
                    current : 3
                },
                {
                    name : 'weaponspecial',
                    current : 'Blast 6, Cumbersome 3, Limited Ammo 6'
                },
                {
                    name : 'weaponcondition',
                    current : ''
                },
                {
                    name : 'weapondice',
                    current : ''
                }
            ], 
        },
        
    }