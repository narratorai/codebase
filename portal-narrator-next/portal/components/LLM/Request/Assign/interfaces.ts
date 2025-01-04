export enum ApproachTypes {
  least_requests = 'least_requests',
  round_robin = 'round_robin',
  no_auto_assign = 'no_auto_assign',
}

export enum AssignTypes {
  all_admins = 'all_admins',
  job_titles = 'job_titles',
  users = 'users',
}

export interface IFormData {
  approach: keyof typeof ApproachTypes
  assign_type: keyof typeof AssignTypes
  assigned_to?: string[]
}
