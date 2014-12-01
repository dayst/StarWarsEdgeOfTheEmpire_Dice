/* Import Character

 Chat command: !eechar character(Name)
 Chat example: !eechar character(Smuggler Baron)
 
 Note: Need Eote_Weapons.js to work

 * ------------------------------------------------------------------- */
    var eotechar = {}

    eotechar.init = function() {
        //eotechar.setCharacterDefaults(); No defaults
        eotechar.events();
    }
    
    eotechar.defaults = {  
        globalVars : {},
        graphics : {},
        regex : {
            cmd : /!eechar/,
            character : /character\((.*?)\)/,
        },
        'import' : {}
    }
    
    eotechar.createObj = function() {//Create Object Fix - Firebase.set failed - Do not edit
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
    
    
    /* CHARACTER IMPORT PROCESS 
     * 
     * Matches the different regex commands and runs that dice processing step
     * 
     * ---------------------------------------------------------------- */
    
    eotechar.process = {}
    
    eotechar.process.setup = function(cmd, playerName, playerID) {
        
		if (!cmd.match(eotechar.defaults.regex.cmd)) { //check for api cmd !eed
            return false;
    	}
		
		//Match Character
        var characterMatch = cmd.match(eotechar.defaults.regex.character);
        
		if (characterMatch) {
			eotechar.process.addCharacter(characterMatch);
		}
        
    }
	
	/* CHARACTER PROCESS FUNCTION
     * 
     * ---------------------------------------------------------------- */
	
	eotechar.process.addAttribute = function(attrObj, charID, appendStr) {
		
		//log(charID);
		log(attrObj);
        
		if (attrObj.current && attrObj.current != 0) {
    		eotechar.createObj('attribute', {
    			characterid: charID,
    			name: appendStr + attrObj.name,
    			current: attrObj.current,
    			max: attrObj.max ? attrObj.max : ''
    		});
		}
	}
	
	eotechar.process.addCharacter = function (cmd) {
        
        var characterMatch = cmd[1];
        var charImport = eotechar.defaults['import'][characterMatch];
        
        if (characterMatch && charImport) {
			
			/* Create New Character
			 * Find all characters and check for dups 
			 * ---------------------------------------------------- */
			
            var charName = charImport.overview[0].current;
            var allChars = findObjs({ _type: 'character' });
            var copyStr = '';
            var foundChar = _.filter(allChars, function(a) {
                return (a.get('name').indexOf(charName) >= 0 );
            });

            if (foundChar) { 
                var foundCharCount = _.size(foundChar);
                copyStr = ' - '+ foundCharCount;
            }
            
            //Create New Character and return ID
                charName = charName + copyStr;
			var charObj = createObj('character',{name: charName});
            var charID = charObj.id;
			
            
            /* Add Overview
			 *
			 * ---------------------------------------------------- */
			
            var overviewObj = charImport.overview;
			
            if (overviewObj) {
                _.each(overviewObj, function(attrObj){
                
                    eotechar.process.addAttribute(attrObj,charID,'');
                
                });
            }
            
			/* Add Attributes
			 *
			 * ---------------------------------------------------- */
			
            var attributeObj = charImport.attributes;
    		
            if (attributeObj) {
                _.each(attributeObj, function(attrObj){
                
                    eotechar.process.addAttribute(attrObj,charID,'');
                
                });
            }
            
			/* Add Characteristics
			 *
			 * ---------------------------------------------------- */
			
            var characteristicsObj = charImport.characteristics;
        	
            if (characteristicsObj) {
                _.each(characteristicsObj, function(attrObj){
                
                    eotechar.process.addAttribute(attrObj,charID,'');
                
                });
            }
            
			/* Add skills
			 *
			 * ---------------------------------------------------- */
			
			var skillsObj = charImport.skills;
            
            if (skillsObj) {
                _.each(skillsObj, function(attrObj){
                
                    eotechar.process.addAttribute(attrObj,charID,'');
                
                });
            }
            
            /* Add Equipment
			 *
			 * ---------------------------------------------------- */
			
			var equipmentObj = charImport.equipment;
            
            if (equipmentObj) {
                _.each(equipmentObj, function(attrObj){
                
                    eotechar.process.addAttribute(attrObj,charID,'');
                
                });
            }
			
             /* Add Abilities
    		 *
			 * ---------------------------------------------------- */
			var talentSlot = 0; //also used for talents
			var abilitiesObj = charImport.abilities;
            
            if (abilitiesObj) {
                
                var abilityIndexStr = 'repeating_skills_';

                _.each(abilitiesObj, function(abilityObj){
                   _.each(abilityObj['ability'], function(attrObj){
                        eotechar.process.addAttribute(attrObj, charID, abilityIndexStr+talentSlot+'_');
                    });
                    talentSlot++;
                });
            }
            
            /* Add Talents
			 *
			 * ---------------------------------------------------- */
			
			var talentsObj = charImport.talents;
            
            if (talentsObj) {
                
                var talentIndexStr = 'repeating_skills_';
                
                _.each(talentsObj, function(talentObj){
                   _.each(talentObj['talent'], function(attrObj){
                        eotechar.process.addAttribute(attrObj, charID, talentIndexStr+talentSlot+'_');
                    });
                    talentSlot++;
                });
            }
            
             /* Add Weapons
    		 *
			 * ----------------------------------------------------  */
            
            var weaponsObj = charImport.weapons;
            
            if (weaponsObj) {
                
                _.each(weaponsObj, function(weaponsObj){
                    //sendChat('Alert', '!eeweapon weapon('+ weaponsObj.weapon +') character('+ charName +')');
                    eoteweapon.process.setup('!eeweapon weapon('+ weaponsObj.weapon +') character('+ charName +')', 'Import', 'playerID');
                });
            }
            
			
        } else {
            sendChat("Alert", "Can't find character. Please update character name and try again.");
            return false;
        }
        
    }
	
    eotechar.events = function() {
        
        on("chat:message", function(msg) {
            
            if (msg.type != 'api') {
                return;
            }
            
            eotechar.process.setup(msg.content, msg.who, msg.playerid);
        });
        
    }
    
    on('ready', function() {
        eotechar.init();
        //eotechar.process.setup('!eechar character(Smuggler Baron)', 'Steve', 'playerID');
    });
	
	eotechar.defaults['import'] = {
		'Template' : {
			overview : [
				{name : 'name', current : 'Template [Minion]'},
				{name : 'playername', current : 'EotE (p395)'}, //Page Number
			],
			attributes : [
				{name : 'soak', current : 0},
				{name : 'wounds', current : 0, max : 0},
				{name : 'strain', current : 0, max : 0},
				{name : 'rangeddefense', current : 0},
				{name : 'meleedefense', current : 0},
				{name : 'encumbrance', current : 0, max : 0},
				{name : 'forcerating', current : 0},
				{name : 'forcecommitted', current : 0},
			],
			characteristics : [
				{name : 'brawn', current : 0},
				{name : 'agility', current : 0},
				{name : 'intellect', current : 0},
				{name : 'cunning', current : 0},
				{name : 'willpower', current : 0},
				{name : 'presence', current : 0}
			],
			skills : [
				{name : 'rankAstrogation', current : 0},
				{name : 'rankAthletics', current : 0},
				{name : 'rankCharm', current : 0},
				{name : 'rankCoercion', current : 0},
				{name : 'rankComputers', current : 0},
				{name : 'rankCool', current : 0},
				{name : 'rankCoordination', current : 0},
				{name : 'rankDeception', current : 0},
				{name : 'rankDiscipline', current : 0},
				{name : 'rankLeadership', current : 0},
				{name : 'rankMechanics', current : 0},
				{name : 'rankMedicine', current : 0},
				{name : 'rankNegotiation', current : 0},
				{name : 'rankPerception', current : 0},
				{name : 'rankPlanetary', current : 0},
				{name : 'rankSpace', current : 0},
				{name : 'rankResilience', current : 0},
				{name : 'rankSkulduggery', current : 0},
				{name : 'rankStealth', current : 0},
				{name : 'rankStreetwise', current : 0},
				{name : 'rankSurvival', current : 0},
				{name : 'rankVigilance', current : 0},
				//Combat Skills
				{name : 'rankBrawl', current : 0},
				{name : 'rankGunnery', current : 0},
				{name : 'rankMelee', current : 0},
				{name : 'rankLight', current : 0},
				{name : 'rankHeavy', current : 0},
				//Knowledge Skills
				{name : 'rankCore', current : 0},
				{name : 'rankEducation', current : 0},
				{name : 'rankLore', current : 0},
				{name : 'rankOuter', current : 0},
				{name : 'rankUnderworld', current : 0},
				{name : 'rankXenology', current : 0},
				{name : 'rankWarfare', current : 0}
			],
			abilities : [
				{ability : [
					{name : 'talentname', current: ''},
					{name : 'talentrank', current: ''},
					{name : 'talentsummary', current: ''}
				]}
			],
			talents : [
				{talent : [
					{name : 'talentname', current: 'xxxxxxx'},
					{name : 'talentrank', current: '0'},
					{name : 'talentsummary', current: 'xxxxxxxxxxxxxxxxxx'}
				]},
			],
			weapons : [
				{weapon : 'Heavy Blaster Pistol'},
				{weapon : 'Vibroknife'},
			],
			equipment : [
				{name : 'armor', current: ''},
				{name : 'personalgear', current: ''},
				{name : 'assets', current: ''},
			]
		},
		////////////////////////////
		'Aqualish Thug' : {
			overview : [
				{name : 'name', current : 'Aqualish Thug [Minion]'},
				{name : 'playername', current : 'EotE (p391)'}, //Page Number
			],
			attributes : [
				{name : 'soak', current : 3},
				{name : 'wounds', current : 6, max : 6}
			],
			characteristics : [
				{name : 'brawn', current : 3},
				{name : 'agility', current : 2},
				{name : 'intellect', current : 2},
				{name : 'cunning', current : 2},
				{name : 'willpower', current : 1},
				{name : 'presence', current : 1}
			],
			abilities : [
				{ability : [
					{name : 'talentname', current: 'Minion - Working as group'},
					{name : 'talentrank', current: ''},
					{name : 'talentsummary', current: 'Gain 1 rank of skill per minion in group. (Skills: Brawl, coercion, Melee, Ranged Light)'}
				]}
			],
			weapons : [
				{weapon : 'Blaster Pistol'},
				{weapon : 'Brass Knuckles'},
			]
		},
		'Arms Dealer' : {
			overview : [
				{name : 'name', current : 'Arms Dealer [Rival]'},
				{name : 'playername', current : 'EotE (p391)'}, //Page Number
			],
			attributes : [
				{name : 'soak', current : 3},
				{name : 'wounds', current : 12, max : 12}
			],
			characteristics : [
				{name : 'brawn', current : 2},
				{name : 'agility', current : 2},
				{name : 'intellect', current : 3},
				{name : 'cunning', current : 4},
				{name : 'willpower', current : 1},
				{name : 'presence', current : 3}
			],
			skills : [
				{name : 'rankNegotiation', current : 1},
				{name : 'rankVigilance', current : 1},
				{name : 'rankLight', current : 2},
				{name : 'rankHeavy', current : 2},
			],
			weapons : [
				{weapon : 'Heavy Blaster Pistol'},
				{weapon : 'Vibroknife'},
			]
		},
		'Barabel Enforcer' : {
			overview : [
				{name : 'name', current : 'Barabel Enforcer [Rival]'},
				{name : 'playername', current : 'EotE (p392)'}, //Page Number
			],
			attributes : [
				{name : 'soak', current : 5},
				{name : 'wounds', current : 16, max : 16}
			],
			characteristics : [
				{name : 'brawn', current : 4},
				{name : 'agility', current : 3},
				{name : 'intellect', current : 2},
				{name : 'cunning', current : 3},
				{name : 'willpower', current : 2},
				{name : 'presence', current : 1}
			],
			skills : [
				{name : 'rankPerception', current : 1},
				{name : 'rankSurvival', current : 2},
				{name : 'rankVigilance', current : 1},
				{name : 'rankMelee', current : 2},
				{name : 'rankHeavy', current : 1},
			],
			weapons : [
				{weapon : 'Blaster Carbine'},
				{weapon : 'Combat Knife'},
			]
		},
		'Defel Assassin' : {
			overview : [
				{name : 'name', current : 'Defel Assassin [Nemesis]'},
				{name : 'playername', current : 'EotE (p392)'}, //Page Number
			],
			attributes : [
				{name : 'soak', current : 3},
				{name : 'wounds', current : 17, max : 17},
				{name : 'strain', current : 15, max : 15},
				{name : 'rangeddefense', current : 1},
				{name : 'meleedefense', current : 1}
			],
			characteristics : [
				{name : 'brawn', current : 3},
				{name : 'agility', current : 4},
				{name : 'intellect', current : 3},
				{name : 'cunning', current : 4},
				{name : 'willpower', current : 3},
				{name : 'presence', current : 2}
			],
			skills : [
				{name : 'rankCool', current : 2},
				{name : 'rankCoordination', current : 2},
				{name : 'rankStealth', current : 3},
				{name : 'rankVigilance', current : 2},
				{name : 'rankBrawl', current : 3},
				{name : 'rankMelee', current : 3},
				{name : 'rankLight', current : 2},
			],
			abilities : [
				{ability : [
					{name : 'talentname', current: 'Light Sensitive'},
					{name : 'talentrank', current: ''},
					{name : 'talentsummary', current: 'Defel are vulnerable to bright lights, which cause them intense painand temporary blindness if viewed without protection. A Defel exposed to bright light without protective goggles suffers 2 Setback dice on all skill checks.'}
				]},
				{ability : [
					{name : 'talentname', current: 'Shadowed'},
					{name : 'talentrank', current: ''},
					{name : 'talentsummary', current: 'Defel possess the ability to absorb certain wavelengths of light, making them all but invisible in darkness. When in darkness or deep shadow a Defel gains 2 Boost dice to all Stealth checks.'}
				]}
			],
			talents : [
				{talent : [
					{name : 'talentname', current: 'Adversary'},
					{name : 'talentrank', current: '3'},
					{name : 'talentsummary', current: 'Upgrade difficutly of all combat checks against this target three times.'}
				]},
				{talent : [
					{name : 'talentname', current: 'Deadly Accuracy'},
					{name : 'talentrank', current: ''},
					{name : 'talentsummary', current: 'Adds his ranks in Brawl to all damage inflicted with claws.'}
				]},
				{talent : [
					{name : 'talentname', current: 'Lethal Blows'},
					{name : 'talentrank', current: '2'},
					{name : 'talentsummary', current: 'Adds +20 to Critical Injury rolls against opponents.'}
				]},
			],
			weapons : [
				{weapon : 'Blaster Pistol'}
				/*{weapon : 'Claws'},*/
			]
		},
		'Forger' : {
			overview : [
				{name : 'name', current : 'Forger [Rival]'},
				{name : 'playername', current : 'EotE (p393)'}, //Page Number
			],
			attributes : [
				{name : 'soak', current : 1},
				{name : 'wounds', current : 11, max : 11}
			],
			characteristics : [
				{name : 'brawn', current : 1},
				{name : 'agility', current : 2},
				{name : 'intellect', current : 4},
				{name : 'cunning', current : 4},
				{name : 'willpower', current : 2},
				{name : 'presence', current : 2}
			],
			skills : [
				{name : 'rankComputers', current : 1},
				{name : 'rankPerception', current : 2},
				{name : 'rankSkulduggery', current : 2},
				{name : 'rankVigilance', current : 1},
				{name : 'rankUnderworld', current : 2},
			],
			weapons : [
				{weapon : 'Holdout Pistol'},
				{weapon : 'Vibroknife'},
			],
			equipment : [
				{name : 'personalgear', current: 'Electronic forger\'s kit and tools.'}
			]
		},
		'Infochant' : {
			overview : [
				{name : 'name', current : 'Infochant [Rival]'},
				{name : 'playername', current : 'EotE (p393)'}, //Page Number
			],
			attributes : [
				{name : 'soak', current : 2},
				{name : 'wounds', current : 12, max : 12}
			],
			characteristics : [
				{name : 'brawn', current : 2},
				{name : 'agility', current : 2},
				{name : 'intellect', current : 4},
				{name : 'cunning', current : 3},
				{name : 'willpower', current : 3},
				{name : 'presence', current : 3}
			],
			skills : [
				{name : 'rankDeception', current : 2},
				{name : 'rankPerception', current : 2},
				{name : 'rankVigilance', current : 1},
				{name : 'rankCore', current : 2},
				{name : 'rankEducation', current : 2},
				{name : 'rankLore', current : 2},
				{name : 'rankOuter', current : 2},
				{name : 'rankUnderworld', current : 2},
				{name : 'rankXenology', current : 2},
				{name : 'rankWarfare', current : 2}
			],
			weapons : [
				{weapon : 'Holdout Pistol'}
			],
			equipment : [
				{name : 'personalgear', current: 'Encrypted Datapad, Comlink'},
			]
		},
		'Loan Shark' : {
			overview : [
				{name : 'name', current : 'Loan Shark [Nemesis]'},
				{name : 'playername', current : 'EotE (p393)'}, //Page Number
			],
			attributes : [
				{name : 'soak', current : 3},
				{name : 'wounds', current : 14, max : 14},
				{name : 'strain', current : 13, max : 13},
				{name : 'rangeddefense', current : 1},
				{name : 'meleedefense', current : 1}
			],
			characteristics : [
				{name : 'brawn', current : 2},
				{name : 'agility', current : 3},
				{name : 'intellect', current : 3},
				{name : 'cunning', current : 4},
				{name : 'willpower', current : 3},
				{name : 'presence', current : 4}
			],
			skills : [
				{name : 'rankCharm', current : 2},
				{name : 'rankCoercion', current : 2},
				{name : 'rankCool', current : 2},
				{name : 'rankDeception', current : 4},
				{name : 'rankPerception', current : 2},
				{name : 'rankVigilance', current : 2},
				{name : 'rankLight', current : 2},
			],
			talents : [
				{talent : [
					{name : 'talentname', current: 'Adversary'},
					{name : 'talentrank', current: '1'},
					{name : 'talentsummary', current: 'Upgrade difficulty of all combat checks against this target once.'}
				]},
				{talent : [
					{name : 'talentname', current: 'Natural Negotiator'},
					{name : 'talentrank', current: ''},
					{name : 'talentsummary', current: 'Once per session, may reroll any Cool or Negotiation check.'}
				]},
				{talent : [
					{name : 'talentname', current: 'Spare Clip'},
					{name : 'talentrank', current: ''},
					{name : 'talentsummary', current: 'Does not run out of ammo on a Failure.'}
				]},
			],
			weapons : [
				{weapon : 'Disruptor Pistol'},
				{weapon : 'Holdout Pistol'},
			],
			equipment : [
				{name : 'armor', current: 'Armored clothing (+1 soak, +1 defense)'}
			]
		},
		'Pirate Crew' : {
			overview : [
				{name : 'name', current : 'Pirate Crew [Minion]'},
				{name : 'playername', current : 'EotE (p393)'}, //Page Number
			],
			attributes : [
				{name : 'soak', current : 4},
				{name : 'wounds', current : 5, max : 5}
			],
			characteristics : [
				{name : 'brawn', current : 2},
				{name : 'agility', current : 3},
				{name : 'intellect', current : 1},
				{name : 'cunning', current : 2},
				{name : 'willpower', current : 1},
				{name : 'presence', current : 2}
			],
			abilities : [
				{ability : [
					{name : 'talentname', current: 'Minion - Working as group'},
					{name : 'talentrank', current: ''},
					{name : 'talentsummary', current: 'Gain 1 rank of skill per minion in group. (Skills: Cool, Ranged Heavy or Ranged Light)'}
				]}
			],
			weapons : [
				{weapon : 'Heavy Blaster Pistol'},
				{weapon : 'Blaster Carbine'},
				{weapon : 'Vibroknife'},
			],
			equipment : [
				{name : 'armor', current: 'Padded Armor (+2 Soak)'}
			]
		},
		'Smuggler Baron' : {
			overview : [
				{name : 'name', current : 'Smuggler Baron [Nemesis]'},
				{name : 'playername', current : 'EotE (p395)'}, //Page Number
			],
			attributes : [
				{name : 'soak', current : 3},
				{name : 'wounds', current : 18, max : 18},
				{name : 'strain', current : 13, max : 13},
				{name : 'rangeddefense', current : 1},
				{name : 'meleedefense', current : 1},
				{name : 'encumbrance', current : 0, max : 0},
				{name : 'forcerating', current : 0},
				{name : 'forcecommitted', current : 0},
			],
			characteristics : [
				{name : 'brawn', current : 3},
				{name : 'agility', current : 3},
				{name : 'intellect', current : 3},
				{name : 'cunning', current : 3},
				{name : 'willpower', current : 2},
				{name : 'presence', current : 4}
			],
			skills : [
				{name : 'rankAstrogation', current : 3},
				{name : 'rankCharm', current : 2},
				{name : 'rankCool', current : 3},
				{name : 'rankNegotiation', current : 1},
				{name : 'rankPlanetary', current : 3},
				{name : 'rankSkulduggery', current : 2},
				{name : 'rankStreetwise', current : 4},
				{name : 'rankVigilance', current : 2},
				{name : 'rankGunnery', current : 3},
				{name : 'rankLight', current : 3},
				{name : 'rankUnderworld', current : 3},
			],
			talents : [
				{talent : [
					{name : 'talentname', current: 'Adversary'},
					{name : 'talentrank', current: '1'},
					{name : 'talentsummary', current: 'Upgrade difficulty of all combat checks against this target once.'}
				]},
				{talent : [
					{name : 'talentname', current: 'Master Pilot'},
					{name : 'talentrank', current: ''},
					{name : 'talentsummary', current: 'Once per round, suffer two strain to perform one Pilot action as maneuver.'}
				]},
				{talent : [
					{name : 'talentname', current: 'Skill Jockey'},
					{name : 'talentrank', current: '2'},
					{name : 'talentsummary', current: 'Remove 2 setback from all Pilot checks.'}
				]}
			],
			weapons : [
				{weapon : 'Heavy Blaster Pistol'},
				{weapon : 'Vibroknife'},
			],
			equipment : [
				{name : 'armor', current: 'Armored Clothing (+1 defense, +1 soak)'},
				{name : 'personalgear', current: ''},
				{name : 'assets', current: 'YT-2400 Freighter - EotE (p265)'},
			]
		},
		
		
		
	}
	