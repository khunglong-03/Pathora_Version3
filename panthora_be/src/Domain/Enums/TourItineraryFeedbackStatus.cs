using System;

namespace Domain.Enums;


public enum TourItineraryFeedbackStatus
{
    Pending = 0,
    ManagerForwarded = 1,
    OperatorResponded = 2,
    ManagerApproved = 3,
    ManagerRejected = 4,
    CustomerAccepted = 5,
    CustomerRejected = 6
}
