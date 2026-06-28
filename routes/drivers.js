const express = require('express');
const makeCrudRouter = require('./_crudFactory');

const allowedFields = ['name', 'jshir', 'car', 'plate', 'city', 'status', 'note', 'loads', 'rating', 'contract_file'];

module.exports = makeCrudRouter(express, 'drivers', allowedFields);
