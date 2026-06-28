const express = require('express');
const makeCrudRouter = require('./_crudFactory');

const allowedFields = ['name', 'phone', 'role', 'note'];

module.exports = makeCrudRouter(express, 'workers', allowedFields);
