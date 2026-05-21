import express from 'express';
import User from '../models/User.js';

const router = express.Router();

import { getUsers } from '../controllers/User/getUsers.js';
import { getUser } from '../controllers/User/getUser.js';
import { addUser } from '../controllers/User/addUser.js';
import { deleteUser } from '../controllers/User/deleteUser.js';
import { updateUser } from '../controllers/User/updateUser.js';
import { updateUserByCandidate } from '../controllers/User/updateUserByCandidate.js';
import { toggleFollow } from '../controllers/User/toggleFollow.js';
import { getNetwork } from '../controllers/User/getNetwork.js';

router.get('/all-users', getUsers); 
router.post('/add-user', addUser); 
router.get('/user/:id', getUser); 
router.delete('/delete-user/:id', deleteUser); 
router.put('/update-user/:id', updateUser);
router.put('/update-user-by-candidate/', updateUserByCandidate);
router.put('/user/:id/follow', toggleFollow);
router.get('/user/:id/network', getNetwork);

export default router;