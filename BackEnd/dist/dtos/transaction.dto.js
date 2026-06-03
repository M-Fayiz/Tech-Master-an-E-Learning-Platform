"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionHistoryDto = transactionHistoryDto;
const user_types_1 = require("../types/user.types");
function transactionHistoryDto(data, role) {
    return {
        _id: data._id,
        amount: data.amount,
        date: data.createdAt,
        paymentTypes: data.paymentType,
        status: data.status,
        mentorShare: role == user_types_1.IRole.Admin ? data.mentorShare : 0,
        share: role == user_types_1.IRole.Admin ? data.adminShare : data.mentorShare,
    };
}
