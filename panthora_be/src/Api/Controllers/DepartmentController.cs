using Api.Endpoint;
using Application.Common.Constant;
using Application.Features.Department.Commands;
using Application.Features.Department.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Policy = "AdminOnly")]
[Route(DepartmentEndpoint.Base)]
public class DepartmentController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await Sender.Send(new GetAllDepartmentsQuery());
        return HandleResult(result);
    }

    [HttpGet(DepartmentEndpoint.ComboBox)]
    public async Task<IActionResult> GetComboBox()
    {
        var result = await Sender.Send(new GetDepartmentComboBoxQuery());
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDepartmentCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateDepartmentCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpDelete(DepartmentEndpoint.Id)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await Sender.Send(new DeleteDepartmentCommand(id));
        return HandleResult(result);
    }
}
