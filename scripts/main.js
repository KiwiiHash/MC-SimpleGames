import {
    system,
    CommandPermissionLevel,
    CustomCommandStatus,
    CustomCommandParamType
} from "@minecraft/server";


const FULL_REWARD = 10;
const FULL_LOSS = 5;
const MIN_LEVEL_REQUIRED = 10;
const HALF_REWARD = Math.floor(FULL_REWARD / 2);
const HALF_LOSS = Math.floor(FULL_LOSS / 2);

const COOLDOWN_TICKS = 200; // 10 seconds


const COOLDOWN_PROPERTY = "openair:gamble_cooldown";

const ANSWER_PROPERTY = "openair:gamble_answer";

const HILO_NUMBER_PROPERTY = "openair:hilo_number";

const HILO_ACTIVE_PROPERTY = "openair:hilo_active";

function hasEnoughLevels(player) {

    return player.level >= MIN_LEVEL_REQUIRED;

}

function randomNumber() {
    return Math.floor(Math.random() * 9) + 1;
}

function randomDifferentNumber(first) {

    let second;

    do {

        second = randomNumber();

    } while (second === first);


    return second;

}


function checkCooldown(player) {

    const current =
        system.currentTick;


    const cooldown =
        player.getDynamicProperty(
            COOLDOWN_PROPERTY
        ) ?? 0;



    if (current < cooldown) {

        return Math.ceil(
            (cooldown - current) / 20
        );

    }


    player.setDynamicProperty(
        COOLDOWN_PROPERTY,
        current + COOLDOWN_TICKS
    );


    return 0;
}





system.beforeEvents.startup.subscribe((event)=>{



// ==========================
// NORMAL GAMBLE
// ==========================


event.customCommandRegistry.registerCommand(
{

    name:
    "openair:gamble",

    description:
    "Start a number gamble",

    permissionLevel:
    CommandPermissionLevel.Any,

    cheatsRequired:false

},


(origin)=>{


    const player =
        origin.sourceEntity;



    if(!player){

        return {
            status:
            CustomCommandStatus.Failure
        };

    }

    if (!hasEnoughLevels(player)) {

    return {

        status:
        CustomCommandStatus.Failure,

        message:
        `§cYou need at least ${MIN_LEVEL_REQUIRED} levels to gamble.`

    };

}

    const cooldown =
        checkCooldown(player);



    if(cooldown > 0){

        return {

            status:
            CustomCommandStatus.Failure,

            message:
            `§cWait ${cooldown}s before gambling again.`

        };

    }



    const first =
        randomNumber();


    const second =
        randomNumber();



    player.setDynamicProperty(
        ANSWER_PROPERTY,
        `${first},${second}`
    );



    player.sendMessage(
        "§6§lGamble Started!"
    );


    player.sendMessage(
        "§7Guess one or two numbers."
    );


    player.sendMessage(
        "§eFull:"
    );


    player.sendMessage(
        "§f/gambleguess <number1> <number2>"
    );


    player.sendMessage(
        "§bHalf reward:"
    );


    player.sendMessage(
        "§f/gambleguess <number>"
    );



    return {

        status:
        CustomCommandStatus.Success

    };


});






// ==========================
// NORMAL GUESS
// ==========================


event.customCommandRegistry.registerCommand(
{

    name:
    "openair:gambleguess",

    description:
    "Guess gamble numbers",

    permissionLevel:
    CommandPermissionLevel.Any,

    cheatsRequired:false,


    optionalParameters:[

        {
            name:"number1",

            type:
            CustomCommandParamType.Integer
        },

        {
            name:"number2",

            type:
            CustomCommandParamType.Integer
        }

    ]

},


(origin,...args)=>{


    const player =
        origin.sourceEntity;



    if(!player)
        return;



    const answer =
        player.getDynamicProperty(
            ANSWER_PROPERTY
        );



    if(!answer){

        return {

            status:
            CustomCommandStatus.Failure,

            message:
            "§cStart a gamble first."

        };

    }



    const numbers =
        answer.split(",");



    let correct = false;

    let reward;

    let loss;



    if(args.length >= 2){


        reward =
        FULL_REWARD;


        loss =
        FULL_LOSS;



        correct =
            args[0] === Number(numbers[0]) &&
            args[1] === Number(numbers[1]);



    }

    else if(args.length === 1){


        reward =
        HALF_REWARD;


        loss =
        HALF_LOSS;



        correct =
            args[0] === Number(numbers[0]) ||
            args[0] === Number(numbers[1]);

    }

    else{


        return {

            status:
            CustomCommandStatus.Failure,

            message:
            "§cEnter a number."

        };

    }




    system.run(()=>{


        if(correct){


            player.sendMessage(
                `§aCorrect! +${reward} Levels`
            );


            player.addLevels(
                reward
            );


        }

        else{


            player.sendMessage(
                `§cWrong! -${loss} Levels`
            );


            player.addLevels(
                -loss
            );


        }



        player.setDynamicProperty(
            ANSWER_PROPERTY,
            undefined
        );


    });



    return {

        status:
        CustomCommandStatus.Success

    };


});








// ==========================
// HILO START
// ==========================


event.customCommandRegistry.registerCommand(
{

    name:
    "openair:gamblehilo",

    description:
    "Start HiLo gamble",

    permissionLevel:
    CommandPermissionLevel.Any,

    cheatsRequired:false

},


(origin)=>{


    const player =
        origin.sourceEntity;



    if(!player)
        return;



    const cooldown =
        checkCooldown(player);



    if(cooldown > 0){

        return {

            status:
            CustomCommandStatus.Failure,

            message:
            `§cWait ${cooldown}s.`

        };

    }
    
    if (!hasEnoughLevels(player)) {

    return {

        status:
        CustomCommandStatus.Failure,

        message:
        `§cYou need at least ${MIN_LEVEL_REQUIRED} levels to gamble.`

    };
}



    const number =
        randomNumber();



    player.setDynamicProperty(
        HILO_NUMBER_PROPERTY,
        number
    );


    player.setDynamicProperty(
        HILO_ACTIVE_PROPERTY,
        true
    );



    player.sendMessage(
        "§6§lHiLo Started!"
    );


    player.sendMessage(
        `§eYour number: §a${number}`
    );


    player.sendMessage(
        "§f/hiloguess higher"
    );


    player.sendMessage(
        "§f/hiloguess lower"
    );



    return {

        status:
        CustomCommandStatus.Success

    };


});








// ==========================
// HILO GUESS
// ==========================


event.customCommandRegistry.registerCommand(
{

    name:
    "openair:hiloguess",

    description:
    "Guess if next number is higher or lower",

    permissionLevel:
    CommandPermissionLevel.Any,

    cheatsRequired:false,


    mandatoryParameters:[

        {

            name:"guess",

            type:
            CustomCommandParamType.String

        }

    ]

},


(origin,guess)=>{


    const player =
        origin.sourceEntity;



    if(!player)
        return;



    if(
        !player.getDynamicProperty(
            HILO_ACTIVE_PROPERTY
        )
    ){

        return {

            status:
            CustomCommandStatus.Failure,

            message:
            "§cStart HiLo first."

        };

    }



    const first =
        player.getDynamicProperty(
            HILO_NUMBER_PROPERTY
        );



    const second =
    randomDifferentNumber(first);



    let correct=false;



    if(
        guess.toLowerCase()==="higher" &&
        second > first
    )
        correct=true;



    if(
        guess.toLowerCase()==="lower" &&
        second < first
    )
        correct=true;



    system.run(()=>{


        player.sendMessage(
            `§7Second number: §e${second}`
        );



        if(correct){


            player.sendMessage(
                "§aCorrect! +15 Levels"
            );


            player.addLevels(
                15
            );


        }

        else{


            player.sendMessage(
                "§cWrong! -10 Levels"
            );


            player.addLevels(
                -10
            );


        }



        player.setDynamicProperty(
            HILO_ACTIVE_PROPERTY,
            undefined
        );


        player.setDynamicProperty(
            HILO_NUMBER_PROPERTY,
            undefined
        );


    });



    return {

        status:
        CustomCommandStatus.Success

    };


});


});