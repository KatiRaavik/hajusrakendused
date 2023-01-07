export class Task {
    id;
    name;
    completed;
    description;
    createdAt;
}
export function taskFromServer(task) {
    let copy = {} // new Task()
    copy.id = task.id
    copy.completed = task.marked_as_done
    copy.name = task.title
    copy.description = task.desc
    copy.createdAt = task.created_at
    return copy
}
/**
 * @param {Task} task 
 * @returns {object}
 */
export function taskToServer(task) {
    return {
        id: task.id,
        marked_as_done: task.completed,
        title: task.name,
        desc: task.description,
        created_at: task.created_at
    }
}