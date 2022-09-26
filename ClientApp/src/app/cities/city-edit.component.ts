import { Component, Inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { City } from './city';

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
 // id?: number;

  constructor(
    private activatedRout: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    @Inject('BASE_URL') private baseUrl: string) { }
  ngOnInit() {
    this.form = new FormGroup({
      name: new FormControl(''),
      lat: new FormControl(''),
      lon: new FormControl('')
    });
    this.loadData();
  }

  loadData() {
    // Retorno do parâmetro ID
    var id = +this.activatedRout.snapshot.paramMap.get('id');

    // Localzando a cidade no servidor
    var url = this.baseUrl + "api/Cities/" + id;
    this.http.get<City>(url).subscribe(result => {
      this.city = result;
      this.title = "Edit - " + this.city.name;

      // Atualizando o form pela cidade como valor
      this.form.patchValue(this.city);
    }, error => console.error(error));
  }
  onSubmit() {
    var city = this.city;
    city.name = this.form.get("name").value;
    city.lat = + this.form.get("lat").value;
    city.lon = + this.form.get("lon").value;
    var url = this.baseUrl + "api/Cities/" + this.city.id;
    this.http.put<City>(url, city)
      .subscribe(result => {
        console.log("City " + city.id + " has been updated.");

        // Voltando para a View Cidade
        this.router.navigate(['/cities']);
      }, error => console.error(error));
  }
}
