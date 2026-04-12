using Api.Controllers.Manager;
using Application.Features.Manager.DTOs;
using Application.Features.Manager.Commands.UpdateMyBankAccount;
using Application.Features.Manager.Queries.GetMyBankAccount;
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
            accountNumber: "1234567890",
            bankName: "Vietcombank",
            branch: "Hanoi Branch",
            swiftCode: "VCBAVNVX",
            verified: true
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
            accountNumber: "0987654321",
            bankName: "Techcombank",
            branch: "HCM Branch",
            swiftCode: "TCBAVNVX"
        );

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<ManagerBankAccountController, UpdateMyBankAccountCommand, ErrorOr.Success>(
                Result.Success,
                BasePath);

        var actionResult = await controller.UpdateMyBankAccount(request);

        Assert.IsType<ObjectResult>(actionResult);
        var captured = Assert.IsType<UpdateMyBankAccountCommand>(probe.CapturedRequest);
        Assert.Equal(request.AccountNumber, captured.AccountNumber);
        Assert.Equal(request.BankName, captured.BankName);
        Assert.Equal(request.Branch, captured.Branch);
        Assert.Equal(request.SwiftCode, captured.SwiftCode);
    }

    [Fact]
    public async Task UpdateMyBankAccount_InvalidRequest_Returns400()
    {
        var request = new UpdateMyBankAccountRequest(
            accountNumber: null,
            bankName: null,
            branch: null,
            swiftCode: null
        );

        var (controller, _) = ApiControllerTestHelper
            .BuildController<ManagerBankAccountController, UpdateMyBankAccountCommand, ErrorOr.Success>(
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
