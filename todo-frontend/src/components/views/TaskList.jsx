import { DeleteOutlined } from "@ant-design/icons";
import { Input, Button, Checkbox, List, Col, Row, Space, Divider } from "antd";
import debounce from 'lodash.debounce';
import produce from "immer";
import { useEffect } from "react";
import { useState } from "react";
import { useCallback } from 'react';
import { taskFromServer } from "../../DTO/Task";
import { taskToServer } from "../../DTO/Task";
import useBackend from "../hooks/useBackend";
import { useMemo } from "react";


export default function TaskList() {
    const { sendRequest } = useBackend()

    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        sendRequest("/tasks", "GET")
            .then(result => {
                if (result.length)
                    setTasks(result.map(taskFromServer));
                else
                    setTasks([]);
            })
    }, []);

    // const isLoggedIn = useMemo(() => {
        // return ...
    // }, [user])
    
    const debouncedSaveTask = useCallback(debounce((newTasks, task) => {
        saveTask(taskToServer(newTasks.find(t => t.id === task.id)));
    }, 1000), [saveTask]);

    const handleNameChange = (task, event) => {
        console.log(event)
        
        const newTasks = produce(tasks, draft => {
            const index = draft.findIndex(t => t.id === task.id);
            draft[index].name = event.target.value;
           
        });
        setTasks(newTasks);
        
        debouncedSaveTask(newTasks, task);
        // saveTask(taskToServer(newTasks.find(t => t.id === task.id)));
    };


    const handleCompletedChange = (task, event) => {
        console.log(event)

        const newTasks = produce(tasks, draft => {
            const index = draft.findIndex(t => t.id === task.id);
            draft[index].completed = event.target.checked;
        });
        setTasks(newTasks);

        debouncedSaveTask(newTasks, task);
    };

    const handleAddTask = (task, event) => {
        setTasks(produce(tasks, draft => {
            draft.push({
                id: Math.random(),
                name: "",
                completed: false
            });
        }));
        sendRequest("/tasks", "POST", {
            title: "Task " + Math.ceil(Math.random() * 100)
        })
    };

    const saveTask = (task) => {
        if (!task.id)
            sendRequest("/tasks", "POST", task)
        else
            sendRequest("/tasks/" + task.id, "PUT", task)
    }

    const handleDeleteTask = (task) => {
        let newTasks = setTasks(produce(tasks, draft => {
            const index = draft.findIndex(t => t.id === task.id);
            draft.splice(index, 1);
        }));
        sendRequest("/tasks/" + task.id, "DELETE", {

        })
            .then(result => {
                console.log(result)
                setTasks(result.map(newTasks))
            })
    };

    return (
        <Row type="flex" justify="center" style={{ minHeight: '100vh', marginTop: '6rem' }}>
            <Col span={12}>
                <h1>Task List</h1>
                <Button onClick={handleAddTask}>Add Task</Button>
                <Divider />
                <List
                    size="small"
                    bordered
                    dataSource={tasks}
                    renderItem={(task) => <List.Item key={task.id}>
                        <Row type="flex" justify="space-between" align="middle" style={{ width: '100%' }}>
                            <Space>
                                <Checkbox checked={task.completed} onChange={(e) => handleCompletedChange(task, e)} />
                                <Input placeholder={task.name} value={task.name} onChange={(event) => handleNameChange(task, event)} />
                            </Space>
                            <Button type="text" onClick={() => handleDeleteTask(task)}><DeleteOutlined /></Button>
                        </Row>
                    </List.Item>}
                />
            </Col>
        </Row>
    )
}