import { ITrainingsIndexQuery } from 'graph/generated'

export type TrainingsType = ITrainingsIndexQuery['all_trainings']
export type TrainingType = TrainingsType[0]
export type UserQuestionsType = TrainingType['user_training_questions']
