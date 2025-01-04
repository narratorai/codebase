## How templates work

1. We grab the narrative and use it to create the mapping
    1. When creting the mapping we will map the old answer to the `question_id`
        - `activity_id` -> `q.id`
        - `new_feature_id` -> `q.id`
        > Note we never really use feature_id

2. Then we will grab the questions that are in the template and copy over the answers that we have for it

3. We will add the words to the questions from the narrative
4. Once saved, we will add the `new_feature_id` id by fixing the messing of IDS
