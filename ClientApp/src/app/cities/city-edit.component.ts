import { Component, Inject, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { City } from './city';
import { Country } from './../countries/country';

@Component({
  selector: 'app-city-edit',
  templateUrl: './city-edit.component.html',
  styleUrls: ['./city-edit.component.css']
})

export class CityEditComponent implements OnInit {
  // O título da View
  title: string;

  // the form model
  form: FormGroup;

  // O objeto Cidade para a edição
  city: City;

  // Será NULL quando for adicionado uma nova Cidade
  // e não será nulo  quando estiver editando uma Cidade existente
  id?: number;
  // the countries array for the select
  countries: Country[];
  constructor(
    private activatedRout: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    @Inject('BASE_URL') private baseUrl: string) { }
  ngOnInit() {
    this.form = new FormGroup({
      name: new FormControl(''),
      lat: new FormControl(''),
      lon: new FormControl(''),
      countryId: new FormControl('')
    });
    this.loadData();
  }
  loadData() {
    // Load Countries
    this.loadCountries();

    // Retorno do parâmetro ID
    this.id = +this.activatedRout.snapshot.paramMap.get('id');

    if (this.id) {
      // EDIT MODE
      // Localzando a cidade no servidor
      var url = this.baseUrl + "api/Cities/" + this.id;
      this.http.get<City>(url).subscribe(result => {
        this.city = result;
        this.title = "Edit - " + this.city.name;

        // Atualizando o form pela cidade como valor
        this.form.patchValue(this.city);
      }, error => console.error(error));
    }
    else {
      // Add new mode
      this.title = "Create a new City";
    }
  }
  loadCountries() {
    // fetch all the countries from the server
    var url = this.baseUrl + "api/Countries";
    var params = new HttpParams()
      .set("pageIndex", "0")
      .set("PageSise", "9999")
      .set("sortColumn", "name");

    this.http.get<any>(url, { params }).subscribe(result => {
      this.countries = result.data;
    }, error => console.error(error));
  }
  onSubmit() {
    var city = (this.id) ? this.city : <City>{};
    city.name = this.form.get("name").value;
    city.lat = +this.form.get("lat").value;
    city.lon = +this.form.get("lon").value;
    city.countryId = +this.form.get("countryId").value;

    if (this.id) {
      // EDIT MODE
      var url = this.baseUrl + "api/Cities/" + this.city.id;
      this.http.put<City>(url, city)
        .subscribe(result => {
          console.log("City " + city.id + " has been updated.");

          // Voltando para a View Cidade
          this.router.navigate(['/cities']);
        }, error => console.error(error));
    }
    else {
      // ADD NEW MODE
      var url = this.baseUrl + "api/Cities";
      this.http
        .post<City>(url, city)
        .subscribe(result => {
          console.log("City " + result.id + " has been created.");
          // go back to cities view
          this.router.navigate(['/cities']);
        }, error => console.error(error));
    }

    
  }
}
