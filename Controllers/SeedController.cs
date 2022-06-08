using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WorldCities.Data;
using OfficeOpenXml;
using System.IO;
using WorldCities.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using System.Security; 

namespace WorldCities.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class SeedController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        private readonly IWebHostEnvironment _env;

        public SeedController(ApplicationDbContext context,
            IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet]
        public  async Task<ActionResult>  Import()
        {
            // prevent non-development  environments from running this method
            if (!_env.IsDevelopment())
                throw new SecurityException("Not allowed");

            var path = Path.Combine(_env.ContentRootPath, "Data/Source/worldcities.xlsx");

            using var stream = System.IO.File.OpenRead(path);
            using var excelPackage = new ExcelPackage(stream);

            //  Get  the first Worksheet
            var worksheet = excelPackage.Workbook.Worksheets[0];

            // Define how many rows we  want  to process
            var nEndRow = worksheet.Dimension.End.Row;

            //  Initialize the record couters
            var numberOfCountriesAdded = 0;
            var numberOfCitiesAdded = 0;

            // Create a lookup dictionary
            // Containing all the countries already existing
            // into the Database (it will be empty on first run).
            var countriesByName = _context.Countries
                .AsNoTracking()
                .ToDictionary(x => x.Name, StringComparer.OrdinalIgnoreCase);


            // iterates through all rows, skipping  the first one
            for (int nRow = 2; nRow <= nEndRow; nRow++)
            {
                var row = worksheet.Cells[
                    nRow, 1, nRow, worksheet.Dimension.End.Column];

                var countryName = row[nRow, 5].GetValue<string>();

                var iso2 = row[nRow, 6].GetValue<string>();
                var iso3 = row[nRow, 7].GetValue<string>();

                // Skip this country if it already exists in the database
                if (countriesByName.ContainsKey(countryName))
                    continue;


                // Create the Country entity and fill it with  xlsx data
                var coutry = new Country
                {
                    Name = countryName,
                    ISO2 = iso2,
                    ISO3 = iso3
                };

                // Add the new country to the DB Context
                await _context.Countries.AddAsync(coutry);

                // Store the Country in our lookup to retrieve its Id later on
                countriesByName.Add(countryName, coutry);

                // Increment  the counter
                numberOfCountriesAdded++;
            }

            // Save all the countries into the Database
            if (numberOfCountriesAdded > 0)
                await _context.SaveChangesAsync();

            // Create a lookup dictionary
            // containing all the cities already existing
            // into the Database (it will be empty on first run).
            var cities = _context.Cities
                .AsNoTracking()
                .ToDictionary(x => (
                Name: x.Name,
                Lat: x.Lat,
                Lon: x.Lon,
                CountryId: x.CountryId));

            // Iterates throug all rows, skipping the first one
            for (int nRow = 2; nRow < nEndRow; nRow++)
            {
                var row = worksheet.Cells[
                    nRow, 1, nRow, worksheet.Dimension.End.Column];

                var name = row[nRow, 1].GetValue<string>();
                var nameAscii = row[nRow, 2].GetValue<string>();
                var lat = row[nRow, 3].GetValue<decimal>();
                var lon = row[nRow, 4].GetValue<decimal>();
                var countryName = row[nRow, 5].GetValue<string>();

                // Retrieve country Id by countryName
                var countryId = countriesByName[countryName].Id;

                // Skip this city if it already exists in the database
                if (cities.ContainsKey((Name: name,                    
                        Lat: lat,
                        Lon: lon,
                        CountryId: countryId)))
                    continue;

                //  Create the City entity and fill it with xlsx data
                var city = new City
                {
                    Name = name,
                    Name_ASCII = nameAscii,
                    Lat = lat,
                    Lon = lon,
                    CountryId = countryId
                };

                // Add  the new city to the Db Context
                _context.Cities.Add(city);

                // Increment the counter
                numberOfCitiesAdded++;
            }

            // Save all the cities into the Database
            if (numberOfCitiesAdded > 0)
                await _context.SaveChangesAsync();

            return new JsonResult(new
            { 
                Cities = numberOfCitiesAdded,
                Countries = numberOfCountriesAdded
            });
        }
    }
}
