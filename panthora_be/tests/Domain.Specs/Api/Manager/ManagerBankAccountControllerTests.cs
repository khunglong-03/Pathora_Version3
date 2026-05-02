using global::Api.Controllers.Manager;
using global::Application.Features.Manager.Commands.UpdateMyBankAccount;
using global::Application.Features.Manager.DTOs;
using global::Application.Features.Manager.Queries.GetMyBankAccount;
using global::Application.Contracts.Manager;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Domain.Specs.Api.Manager;

public sealed class ManagerBankAccountControllerTests
{
    private const string BasePath = "/api/manager/me/bank-account";

    [Fact]
    public async Task GetMyBankAccount_WhenHasBankAccount_Returns200()
    {
        var bankAccount = new ManagerBankAccountDto(
            UserId: Guid.NewGuid(),
            BankAccountNumber: "1234567890",
            BankCode: "VCB",
            BankAccountName: "Vietcombank",
            BankAccountVerified: true,
            BankAccountVerifiedAt: DateTimeOffset.UtcNow
        );

        var (controller, _) = ApiControllerTestHelper
            .BuildController<ManagerBankAccountController, GetMyBankAccountQuery, ManagerBankAccountDto>(
                bankAccount,
                BasePath);

        var actionResult = await controller.GetMyBankAccount();

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: BasePath,
            expectedData: bankAccount);
    }

    [Fact]
    public async Task GetMyBankAccount_WhenNoBankAccount_Returns404()
    {
        var (controller, _) = ApiControllerTestHelper
            .BuildController<ManagerBankAccountController, GetMyBankAccountQuery, ManagerBankAccountDto>(
                Error.NotFound("BankAccount.NotFound", "Bank account not found."),
                BasePath);

        var actionResult = await controller.GetMyBankAccount();

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "BankAccount.NotFound",
            expectedMessage: "Bank account not found.",
            expectedInstance: BasePath);
    }

    [Fact]
    public async Task UpdateMyBankAccount_ValidRequest_Returns200()
    {
        var request = new UpdateMyBankAccountRequest(
            BankAccountNumber: "0987654321",
            BankCode: "TCB",
            BankAccountName: "Techcombank"
        );

        var resultDto = new ManagerBankAccountDto(
            UserId: Guid.NewGuid(),
            BankAccountNumber: "0987654321",
            BankCode: "TCB",
            BankAccountName: "Techcombank",
            BankAccountVerified: false,
            BankAccountVerifiedAt: null
        );

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<ManagerBankAccountController, UpdateMyBankAccountCommand, ManagerBankAccountDto>(
                resultDto,
                BasePath);

        var actionResult = await controller.UpdateMyBankAccount(request);

        Assert.IsType<ObjectResult>(actionResult);
        var captured = Assert.IsType<UpdateMyBankAccountCommand>(probe.CapturedRequest);
        Assert.Equal(request.BankAccountNumber, captured.Request.BankAccountNumber);
        Assert.Equal(request.BankCode, captured.Request.BankCode);
        Assert.Equal(request.BankAccountName, captured.Request.BankAccountName);
    }

    [Fact]
    public async Task UpdateMyBankAccount_InvalidRequest_Returns400()
    {
        var request = new UpdateMyBankAccountRequest(
            BankAccountNumber: "",
            BankCode: "",
            BankAccountName: null
        );

        var (controller, _) = ApiControllerTestHelper
            .BuildController<ManagerBankAccountController, UpdateMyBankAccountCommand, ManagerBankAccountDto>(
                Error.Validation("BankAccount.Invalid", "Invalid bank account data."),
                BasePath);

        var actionResult = await controller.UpdateMyBankAccount(request);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status400BadRequest,
            expectedCode: "BankAccount.Invalid",
            expectedMessage: "Invalid bank account data.",
            expectedInstance: BasePath);
    }
}
