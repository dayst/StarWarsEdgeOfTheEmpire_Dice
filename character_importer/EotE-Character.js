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
        'import' : {
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
                    {name : 'rankAthletics', current : 0},
                    {name : 'rankCharm', current : 2},
                    {name : 'rankCoercion', current : 0},
                    {name : 'rankComputers', current : 0},
                    {name : 'rankCool', current : 3},
					{name : 'rankCoordination', current : 0},
					{name : 'rankDeception', current : 0},
					{name : 'rankDiscipline', current : 0},
					{name : 'rankLeadership', current : 0},
					{name : 'rankMechanics', current : 0},
					{name : 'rankMedicine', current : 0},
					{name : 'rankNegotiation', current : 1},
					{name : 'rankPerception', current : 0},
					{name : 'rankPlanetary', current : 3},
					{name : 'rankSpace', current : 0},
					{name : 'rankResilience', current : 0},
					{name : 'rankSkulduggery', current : 2},
					{name : 'rankStealth', current : 0},
					{name : 'rankStreetwise', current : 4},
					{name : 'rankSurvival', current : 0},
					{name : 'rankVigilance', current : 2},
					//Combat Skills
					{name : 'rankBrawl', current : 0},
					{name : 'rankGunnery', current : 3},
					{name : 'rankMelee', current : 0},
					{name : 'rankLight', current : 3},
					{name : 'rankHeavy', current : 0},
					//Knowledge Skills
					{name : 'rankCore', current : 0},
					{name : 'rankEducation', current : 0},
					{name : 'rankLore', current : 0},
					{name : 'rankOuter', current : 0},
					{name : 'rankUnderworld', current : 3},
					{name : 'rankXenology', current : 0},
					{name : 'rankWarfare', current : 0}
				],
				/*abilities : [
					{ability : [
						{name : 'talentname', current: ''},
						{name : 'talentrank', current: ''},
						{name : 'talentsummary', current: ''}
					]}
				],*/
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
            }
        }
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
			 * ---------------------------------------------------- */
            
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