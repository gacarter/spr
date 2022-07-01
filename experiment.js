/*
experiment code for self-paced reading experiments 
*/

var participant_id = jsPsych.data.getURLVariable('participant');
jsPsych.data.addProperties({participant: participant_id}); //attempts to get participant id from url 

var condition_number = participant_id % 8; //change condition number
if (condition_number == 0) { 
   condition_number = 8;
}
jsPsych.data.addProperties({condition: condition_number})

//edit condition number and number of elif clauses based on number of experimental conditions 
if (condition_number == 1) {
  var stimuli_table_filename = 'list1.csv'; //enter file names here 
} else if (condition_number == 2) {
  var stimuli_table_filename = 'list2.csv';
} else if (condition_number == 3) {
  var stimuli_table_filename = 'list3.csv';
} else if (condition_number == 4) {
  var stimuli_table_filename = 'list4.csv';
} else if (condition_number == 5) {
  var stimuli_table_filename = 'list5.csv';
} else if (condition_number == 6) {
  var stimuli_table_filename = 'list6.csv';
} else if (condition_number == 7) {
  var stimuli_table_filename = 'list7.csv';
} else {
  var stimuli_table_filename = 'list8.csv'
}

var debug = false; //make true for short test-version of experiment 

var word_table;

function main() 
{

  string_to_array = function(str) {
      return str.trim().split(" ");
  }

  var check_consent = function(elem) {
    if (document.getElementById('consent_checkbox').checked) {
      return true;
    }
    else {
      alert("If you wish to participate, you must check the boxes next to all three statements");
      return false;
    }
    return false;
  };

  var consent_trial = {
    type:'external-html',
    url: "consent_form.html",
    cont_btn: "start",
    check_fn: check_consent
  };

  //edit with own questions 
  var survey_trial = {
    type: 'survey-text',
    questions: [
      {prompt: "How old are you?", name: "Age", required: true},
      {prompt: "What gender do you identify as?", name: "Gender", required: true}, 
      {prompt: "What is your native language?", name: "L1", required: true}
    ],
  };

  var instructions = {
      type: 'instructions',
      pages: [
        'Your instructions here'],
      show_clickable_nav: true, 
      allow_keys: true
  };

  var fixation = {
    type: 'html-keyboard-response',
    stimulus: '<p style="font-size: 56px;">+</p>',
    trial_duration: 750,
    choices: jsPsych.NO_KEYS
  };

  var trials = [consent_trial, survey_trial, instructions];

  for (var values of word_table) {
    if (values.pause == 1) { 
        var pause_trial = {
          type: 'html-keyboard-response',
          stimulus: "This is a pause trial. You may take as long as you need.<br>To continue with the experiment, please press the 'r' key.",
          choices: ['r'],
          data: values
        }
        trials.push(pause_trial)

    } else {
        trials.push(fixation);
        //initial context trial ensures preamble shown on-screen for set ms
        var context_trial_int = {
          type: 'html-keyboard-response', 
          stimulus: values.context, 
          choices: jsPsych.NO_KEYS, 
          data: values, 
          trial_duration: 2000
        };
        trials.push(context_trial_int);
        
        //second context trial allows participants to progress to next sentence 
        var context_trial_sec = {
          type: 'html-keyboard-response', 
          stimulus: values.context, 
          choices: [32], 
          data: values
        }; 
        trials.push(context_trial_sec)
        
        //target sentence trial 
        var words = string_to_array(values.target)
        for (var word of words) {
          var target_trial = {
            type: 'html-keyboard-response', 
            stimulus: word, 
            choices: [32], 
            data: values, 
          }
        trials.push(target_trial)
        }

        //signals end of practice trials
        if (values.practice_end ==1) {
          var practice_end_trial = {
            type: 'instructions',
            pages: [
              "That was the end of the practice.<br>",
              "The main experiment will now start.<br>Press Next to continue.",
            ],
            show_clickable_nav: true,
            allow_backward: false
          }
        trials.push(practice_end_trial)
        }

        //comprehension question trial 
        if (values.comp == 1) {
          var comp_trial = {
            type: 'html-keyboard-response', 
            stimulus: values.question, 
            choices: ['f', 'j'], //can change keys for comprehension questions here 
            prompt: "Press 'f' for yes and 'j' for no.",
            data: values, 
            on_finish: function(data) { 
              if(data.key_press == jsPsych.pluginAPI.convertKeyCharacterToKeyCode(data.correct_response)) {
                data.correct = true; 
              } else {
                data.correct = false;
              }
              }
            }
          trials.push(comp_trial)
          
          //gives comprehension question feedback 
          var feedback = { 
            type: 'html-keyboard-response',
            stimulus: function() {
              var last_trial_correct = jsPsych.data.get().last(1).values()[0].correct; 
              if (last_trial_correct) {
                return '<p style="color: green;">Correct!</p>';
              } else {
                return '<p style="color: red;">Wrong.</p>'
              }
            },
          trial_duration: 750
        }
          trials.push(feedback)
      }
    }
  }

  var end_trial = {
    type: 'html-button-response',
    stimulus: 'This is the end of the experiment.<br>Thank you!',
    choices: ['Finish']
  }
  trials.push(end_trial)

  //saves data 
  function saveData(name, data_in){
    var url = 'record_result.php';
    var data_to_send = {filename: name, filedata: data_in};
    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data_to_send),
        headers: new Headers({
                'Content-Type': 'application/json'
        })
    })
};

  jsPsych.init({
    timeline: trials,
    on_finish: function(){
        var experiment_data = jsPsych.data.get();
        saveData(participant_id+"_data.csv", experiment_data.csv());
    }
  })
}

function load_then_main()
{
    /*
        Here we give "fetch" a link to the data. Because it's in the same
        directory as experiment.html, we can just use the filename.
        If we were loading it from elsewhere, we could use the folder name
        as well (on the same server) or a full URL for a different server
        (though most browsers complain about this for security reasons).
    */
    var promise = fetch(stimuli_table_filename, {method: 'get'}).then(
        // if the "fetch" is successful (CSV file loaded)
        function (response) {
            if (!response.ok) {
                /*
                    Make an error message (the brackets are just to split
                    it over multiple lines for readability) and show it.
                */
                var error_message = (
                    "Couldn't load "+stimuli_table_filename+"\n"
                    +"The experiment will not proceed."
                );
                window.alert(error_message);
                /*
                    This throws an error so the program ends, i.e. the
                    experiment doesn't start.
                */
                throw "Couldn't load data, exiting.";
            }
            return response.text().then(
                // once the response is converted to text ....
                function (text_in) {
                    // pass that text to papaparse
                    var parse_result = Papa.parse(
                        text_in,
                        {
                            delimiter: ',',
                            header: true,
                            skipEmptyLines: true
                        }
                    );
                    // store the result in word_table
                    word_table = parse_result.data;

                    // if we're in debug mode, shorten the table of trials
                    if (debug) {
                        word_table = word_table.splice(0, 5);
                    }
                }
            );
        }
    );
    promise.then(main);
}

load_then_main();